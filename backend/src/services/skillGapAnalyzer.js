/**
 * skillGapAnalyzer.js
 * Comprehensive, role-agnostic Skill Gap Analyzer for HerGuardian AI.
 *
 * Supports any reasonable career role, specialization, or emerging discipline.
 * Integrates Google Gemini 2.5 Flash for contextual generation with an extensive
 * domain-grounded deterministic curriculum engine fallback.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini model if API key is provided
let geminiModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  } catch (err) {
    console.warn('[SkillGapAnalyzer] Gemini initialization notice:', err.message);
  }
}

// ── SANITY & INPUT VALIDATION ────────────────────────────────────────────────

const GIBBERISH_PATTERNS = [
  /^[^a-zA-Z0-9\s]+$/,                       // only symbols
  /^[0-9\s]+$/,                              // only numbers
  /^(.)\1{4,}$/,                             // single character repeated: aaaaaa
  /^[bcdfghjklmnpqrstvwxyz]{6,}$/i,          // consonant spam without vowels
  /^(asdf|qwerty|zxcv|1234|qwer|hjkl)/i,     // keyboard spam prefixes
];

export function validateCareerRoleInput(role) {
  if (!role || typeof role !== 'string') {
    return { isValid: false, message: 'Please enter a target career role.' };
  }
  const clean = role.trim();
  if (clean.length === 0) {
    return { isValid: false, message: 'Please enter a target career role.' };
  }
  if (clean.length < 2) {
    return { isValid: false, message: 'Career title is too short. Please specify a full professional role (e.g. Cloud Engineer, Data Analyst).' };
  }
  if (clean.length > 150) {
    return { isValid: false, message: 'Career title exceeds maximum length of 150 characters.' };
  }

  // Pure symbols or pure numbers
  if (/^[^a-zA-Z\s]+$/.test(clean) || /^[0-9\s]+$/.test(clean)) {
    return {
      isValid: false,
      message: 'Please enter a valid career title or profession rather than numbers or symbols.',
    };
  }

  // Check for keyboard spam, single character repetition, or impossible consonant clusters
  const words = clean.split(/\s+/);
  for (const w of words) {
    if (
      /^(.)\1{3,}$/.test(w) ||
      /^(asdf|qwerty|zxcv|1234|qwer|hjkl)/i.test(w) ||
      /^[bcdfghjklmnpqrstvwxyz]{6,}$/i.test(w)
    ) {
      return {
        isValid: false,
        message: 'Please enter a valid career title or profession rather than arbitrary characters.',
      };
    }
  }

  return { isValid: true, cleanRole: clean };
}

// ── CURRICULUM TAXONOMY & ROLE KNOWLEDGE BASE ────────────────────────────────

export const ROLE_KNOWLEDGE_BASE = {
  'software engineer': {
    title: 'Software Engineer',
    description: 'Designs, develops, tests, and maintains robust software systems, applications, and APIs across modern stacks.',
    technicalSkills: ['Python / JavaScript', 'Data Structures & Algorithms', 'Git & Version Control', 'RESTful API Design', 'Relational Databases (SQL)', 'Automated Unit & Integration Testing', 'Linux Command Line', 'System Design & Architecture'],
    professionalSkills: ['Code Review & Collaboration', 'Agile / Scrum Methodologies', 'Technical Documentation', 'Problem Decomposition'],
    roadmap: [
      { stage: 'Phase 1: Foundations', milestones: ['Master core programming language syntax and OOP principles', 'Implement basic data structures (arrays, trees, hash maps) and algorithms', 'Version control workflows with Git and GitHub'], estimatedHours: '60–80 hours' },
      { stage: 'Phase 2: Full-Stack & APIs', milestones: ['Build and document REST APIs with Express or FastAPI', 'Design normalized relational database schemas with PostgreSQL', 'Implement automated unit test suites (Jest / PyTest)'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 3: Production & Architecture', milestones: ['Containerize applications with Docker', 'Deploy to cloud environments (AWS/GCP)', 'Study scalable system design and caching strategies'], estimatedHours: '80–100 hours' },
    ],
    projects: [
      { title: 'Full-Stack Task & Workflow API', description: 'Build a secure REST API with authentication, pagination, and relational database persistence.', skillsPracticed: ['Node.js/Python', 'SQL', 'JWT Auth', 'REST Design'], deliverable: 'Deployed web application with OpenAPI documentation' },
      { title: 'Distributed Log Monitor & Parser', description: 'Develop a CLI service that streams and parses web server access logs with search capabilities.', skillsPracticed: ['Data Structures', 'File I/O', 'Testing', 'CLI'], deliverable: 'GitHub repository with 90%+ test coverage' },
    ],
  },
  'ai security engineer': {
    title: 'AI Security Engineer',
    description: 'Secures machine learning models, training data pipelines, inference infrastructure, and defends against prompt injection, model inversion, and data poisoning attacks.',
    technicalSkills: ['Python & PyTorch/TensorFlow', 'Adversarial Machine Learning', 'Prompt Injection & Jailbreak Defense', 'OWASP Top 10 for LLMs', 'Model Inversion & Membership Inference Attacks', 'API Security & Cryptography', 'Secure Model Serialization (SafeTensors)', 'Cloud & Container Security (Docker, Kubernetes)'],
    professionalSkills: ['Threat Modeling & Risk Assessment', 'Security Audit Reporting', 'Ethical AI Governance', 'Incident Response Collaboration'],
    roadmap: [
      { stage: 'Phase 1: ML & Cybersecurity Fundamentals', milestones: ['Solidify core Python, linear algebra, and ML inference mechanics', 'Master foundational web security, OAuth, and OWASP Top 10', 'Understand model architecture and tokenization'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 2: Adversarial AI & LLM Threat Modeling', milestones: ['Study prompt injection vectors and multi-modal adversarial jailbreaks', 'Practice model inversion and training data extraction simulations', 'Implement guardrail filters (Llama Guard, NeMo Guardrails)'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 3: Production AI Hardening', milestones: ['Harden inference endpoints with rate-limiting, token quotas, and mTLS', 'Audit weights for unsafe deserialization (Pickle vs SafeTensors)', 'Build automated red-teaming pipelines for generative models'], estimatedHours: '80–110 hours' },
    ],
    projects: [
      { title: 'Generative AI Red-Teaming Benchmark', description: 'Construct an automated test harness evaluating LLM application defenses against prompt injection and data exfiltration.', skillsPracticed: ['Python', 'OWASP LLM', 'Automated Testing', 'Threat Modeling'], deliverable: 'Open-source benchmark tool with vulnerability score reports' },
      { title: 'Secure Model Pipeline & Guardrail Filter', description: 'Implement an end-to-end inference proxy that screens user prompts and model responses for toxicity and secret leakage.', skillsPracticed: ['FastAPI', 'Regex/Guardrails', 'Docker', 'Cryptography'], deliverable: 'Containerized proxy service with audit logging' },
    ],
  },
  'machine learning engineer': {
    title: 'Machine Learning Engineer',
    description: 'Researches, trains, optimizes, and productionizes machine learning and deep learning models for scalable inference and business intelligence.',
    technicalSkills: ['Python', 'PyTorch or TensorFlow', 'Scikit-Learn & pandas', 'Feature Engineering & Data Cleaning', 'Model Evaluation & Hyperparameter Tuning', 'MLOps & Experiment Tracking (MLflow/Weights & Biases)', 'Model Serving & Optimization (ONNX, Triton)', 'Docker & Cloud Deployment'],
    professionalSkills: ['Translating Business Problems to ML Metrics', 'Cross-functional Communication with Data Engineers', 'Scientific Experimentation Discipline'],
    roadmap: [
      { stage: 'Phase 1: Mathematics & Classical ML', milestones: ['Linear algebra, multivariate calculus, and probability theory', 'Data manipulation with pandas and feature engineering', 'Classical algorithms: Random Forests, Gradient Boosting, SVMs'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 2: Deep Learning & Frameworks', milestones: ['Neural network architectures (CNNs, Transformers) in PyTorch', 'Loss optimization, regularization, and backpropagation mechanics', 'Model fine-tuning and transfer learning workflows'], estimatedHours: '90–110 hours' },
      { stage: 'Phase 3: MLOps & Production Inference', milestones: ['Packaging models with FastAPI and Docker', 'Building automated retraining pipelines with GitHub Actions or Airflow', 'Monitoring model drift and latency in production'], estimatedHours: '80–100 hours' },
    ],
    projects: [
      { title: 'Production Sentiment & Intent Classifier', description: 'Train a transformer-based text classifier, containerize it, and expose low-latency inference via REST API.', skillsPracticed: ['PyTorch', 'Transformers', 'FastAPI', 'Docker'], deliverable: 'Deployed inference API with latency monitoring' },
      { title: 'End-to-End Churn Prediction Pipeline', description: 'Build an automated pipeline that ingests tabular data, tunes XGBoost hyperparameters, and tracks artifacts in MLflow.', skillsPracticed: ['Scikit-Learn', 'MLflow', 'Feature Engineering'], deliverable: 'Reproducible notebook and pipeline codebase' },
    ],
  },
  'cloud security architect': {
    title: 'Cloud Security Architect',
    description: 'Designs resilient, zero-trust cloud architectures across AWS, Azure, or GCP, ensuring data protection, compliance, and automated threat detection.',
    technicalSkills: ['Multi-Cloud Infrastructure (AWS/Azure/GCP)', 'Identity & Access Management (IAM / Least Privilege)', 'Zero Trust Network Architecture (VPC, CIDR, Firewalls)', 'Infrastructure as Code (Terraform)', 'Cloud Security Posture Management (CSPM)', 'KMS Encryption & Key Management', 'Kubernetes Security & Container Isolation', 'SIEM & Cloud Logging (CloudTrail, GuardDuty)'],
    professionalSkills: ['Compliance Standards (SOC2, ISO 27001, GDPR)', 'Executive Security Risk Communication', 'Security Architecture Review'],
    roadmap: [
      { stage: 'Phase 1: Cloud & Networking Foundations', milestones: ['Master core VPC networking, subnets, route tables, and gateways', 'Deep dive into IAM roles, permission boundaries, and SCPs', 'Configure secure storage buckets and object encryption (KMS)'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 2: Infrastructure as Code & Policy as Code', milestones: ['Write secure modular Terraform configurations', 'Automate linting and static analysis (tfsec, checkov)', 'Enforce Policy-as-Code with Open Policy Agent (OPA)'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 3: Threat Detection & Incident Response', milestones: ['Architect centralized logging and alerting pipelines', 'Build incident playbooks for credential exposure and anomalous logins', 'Design secure Kubernetes microservice meshes'], estimatedHours: '80–100 hours' },
    ],
    projects: [
      { title: 'Terraform Zero-Trust Cloud Blueprint', description: 'Build a compliant, multi-tier cloud VPC architecture with private subnets, bastionless access, and least-privilege IAM.', skillsPracticed: ['Terraform', 'AWS/GCP', 'IAM', 'KMS Encryption'], deliverable: 'Documented Terraform module passing Checkov security scans' },
      { title: 'Automated Cloud Security Audit Bot', description: 'Develop a Python script querying cloud APIs to identify public buckets, inactive MFA, and wide-open security groups.', skillsPracticed: ['Python', 'Boto3/GCP SDK', 'CSPM', 'Reporting'], deliverable: 'CLI audit tool with JSON/HTML executive reports' },
    ],
  },
  'blockchain developer': {
    title: 'Blockchain Developer',
    description: 'Engineers decentralized applications (dApps), smart contracts, consensus protocols, and secure Web3 integration layers.',
    technicalSkills: ['Solidity / Rust', 'EVM Architecture & Gas Optimization', 'Smart Contract Security & Reentrancy Auditing', 'Hardhat / Foundry Testing Suites', 'Web3.js / Ethers.js / Viem', 'Decentralized Storage (IPFS / Arweave)', 'Cryptography & Zero-Knowledge Basics', 'DeFi Protocols & Token Standards (ERC-20, ERC-721)'],
    professionalSkills: ['Security-First Mindset', 'Decentralized Governance Understanding', 'Audit Remediation Communication'],
    roadmap: [
      { stage: 'Phase 1: Blockchain Fundamentals & Solidity', milestones: ['Cryptographic hashing, public-key cryptography, and consensus mechanisms', 'Write, compile, and deploy foundational Solidity contracts', 'Master ERC-20 and ERC-721 token standards'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 2: Testing, Security & Gas Optimization', milestones: ['Write unit and invariant fuzz tests in Foundry or Hardhat', 'Deep dive into famous hacks (reentrancy, integer overflow, flash loans)', 'Optimize storage layouts to minimize user gas fees'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 3: Full-Stack dApp Development', milestones: ['Connect browser wallets (MetaMask, WalletConnect) using Viem', 'Integrate decentralized storage with IPFS for NFT metadata', 'Deploy to Ethereum testnets (Sepolia/Arbitrum)'], estimatedHours: '70–90 hours' },
    ],
    projects: [
      { title: 'Decentralized Micro-Grant Escrow Contract', description: 'Write and audit a multi-signature grant disbursement smart contract with milestone-based payout release.', skillsPracticed: ['Solidity', 'Foundry', 'Access Control', 'Gas Optimization'], deliverable: 'Verified contract on Sepolia testnet with 100% test coverage' },
      { title: 'Web3 Community Membership dApp', description: 'Build a Next.js/React frontend interacting with an on-chain soulbound token gating community access.', skillsPracticed: ['React', 'Ethers.js/Viem', 'IPFS', 'Wallet Auth'], deliverable: 'Live web app allowing wallet login and on-chain verification' },
    ],
  },
  'robotics engineer': {
    title: 'Robotics Engineer',
    description: 'Designs, simulates, programs, and deploys autonomous mechanical and electronic robotic systems combining hardware control with algorithmic intelligence.',
    technicalSkills: ['C++ & Modern Python', 'ROS2 (Robot Operating System)', 'Kinematics & Dynamics Modeling', 'Computer Vision & OpenCV', 'Path Planning (A*, Dijkstra, RRT)', 'Sensor Fusion (LiDAR, IMU, Kalman Filters)', 'Embedded Systems (ARM, Microcontrollers)', 'Simulation (Gazebo, Isaac Sim)'],
    professionalSkills: ['Hardware-Software Integration Troubleshooting', 'Safety Engineering & Fail-Safes', 'Interdisciplinary Teamwork'],
    roadmap: [
      { stage: 'Phase 1: Math & Embedded Control', milestones: ['Linear algebra, differential equations, and rigid body transformations', 'Microcontroller programming (C/C++, GPIO, I2C, SPI)', 'Motor control algorithms (PID tuning, PWM)'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 2: ROS2 & Simulation', milestones: ['Understand ROS2 nodes, topics, services, and actions', 'Model robotic arms and mobile bases using URDF/Xacro', 'Run realistic physics simulations in Gazebo'], estimatedHours: '90–110 hours' },
      { stage: 'Phase 3: Autonomous Navigation & Perception', milestones: ['Process camera feeds with OpenCV for object detection and visual odometry', 'Implement SLAM (Simultaneous Localization and Mapping) with LiDAR', 'Deploy path planners with obstacle avoidance'], estimatedHours: '90–120 hours' },
    ],
    projects: [
      { title: 'Simulated Autonomous Delivery Rover', description: 'Simulate a differential-drive robot in Gazebo that navigates an indoor map using LiDAR SLAM and Nav2.', skillsPracticed: ['ROS2', 'Gazebo', 'Nav2', 'SLAM', 'Python/C++'], deliverable: 'Reproducible ROS2 workspace package with launch files' },
      { title: 'Computer Vision Robotic Arm Sorter', description: 'Program inverse kinematics for a multi-axis arm that picks and sorts items based on color and shape detection.', skillsPracticed: ['OpenCV', 'Kinematics', 'Microcontrollers', 'PID Control'], deliverable: 'Video demonstration and hardware firmware repository' },
    ],
  },
  'bioinformatics analyst': {
    title: 'Bioinformatics Analyst',
    description: 'Applies computational algorithms, statistical genetics, and biological databases to interpret genomic, transcriptomic, and proteomic datasets.',
    technicalSkills: ['Python (Biopython, pandas, NumPy)', 'R (Bioconductor, DESeq2, ggplot2)', 'Next-Generation Sequencing (NGS) Pipeline Analysis', 'Linux / Bash Scripting & High-Performance Computing (HPC)', 'Variant Calling & Annotation (GATK, VCFtools)', 'RNA-Seq Differential Expression Analysis', 'Biological Databases (NCBI, Ensembl, UniProt)', 'Workflow Managers (Snakemake or Nextflow)'],
    professionalSkills: ['Scientific Literature Synthesis', 'Statistical Validation & Multiple Hypothesis Testing', 'Interpreting Clinical/Biological Context'],
    roadmap: [
      { stage: 'Phase 1: Biology & Computational Tools', milestones: ['Molecular biology core concepts (DNA, RNA, proteins, transcription)', 'Command-line Linux file processing (awk, sed, grep)', 'Python and R scripting for biological data formats (FASTA, FASTQ, BAM)'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 2: NGS Pipelines & Gene Expression', milestones: ['Read quality control (FastQC) and alignment (BWA, Bowtie2)', 'RNA-Seq quantification (Salmon, STAR) and differential expression (DESeq2)', 'Gene Ontology (GO) and pathway enrichment analysis'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 3: Scalable Genomic Workflows', milestones: ['Build reproducible data pipelines with Nextflow or Snakemake', 'Variant identification and clinical consequence prediction (VEP)', 'Containerizing bioinformatics workflows with Docker/Singularity'], estimatedHours: '80–100 hours' },
    ],
    projects: [
      { title: 'Automated RNA-Seq Differential Expression Pipeline', description: 'Develop a Snakemake pipeline that processes raw FASTQ files into publication-ready PCA plots and volcano plots.', skillsPracticed: ['R/Bioconductor', 'Snakemake', 'Bash', 'DESeq2'], deliverable: 'GitHub pipeline with sample datasets and visualization dashboard' },
      { title: 'Genomic Variant Prioritization Script', description: 'Build a Python tool that parses VCF files and cross-references ClinVar/dbSNP to flag pathogenic mutations.', skillsPracticed: ['Python', 'Biopython', 'VCFtools', 'Genomics'], deliverable: 'CLI utility with annotated TSV summary output' },
    ],
  },
  'prompt engineer': {
    title: 'Prompt Engineer & AI Interaction Designer',
    description: 'Architects, evaluates, and standardizes multi-step prompts, system instructions, and RAG evaluation pipelines for generative AI applications.',
    technicalSkills: ['Advanced Prompt Framing (Few-Shot, Chain-of-Thought, ReAct)', 'Structured Output Engineering (JSON Schemas, Function Calling)', 'Retrieval-Augmented Generation (RAG) Architecture', 'Vector Databases & Semantic Embeddings', 'LLM Evaluation & Benchmarking (Ragas, TruLens)', 'Python & LangChain / LlamaIndex', 'Token Economics & Latency Optimization', 'Safety & Hallucination Mitigation Strategies'],
    professionalSkills: ['Linguistic Precision & Taxonomy Design', 'Experimental Hypothesis Testing', 'User Intent Decoding'],
    roadmap: [
      { stage: 'Phase 1: Foundation Models & Prompt Mechanics', milestones: ['Understand transformer context windows, temperature, top-p, and tokenization', 'Master role-based prompting, delimiter structuring, and negative constraints', 'Design consistent few-shot exemplars for classification and extraction'], estimatedHours: '50–70 hours' },
      { stage: 'Phase 2: Structured Outputs & Tool Calling', milestones: ['Engineer JSON-guaranteed responses using model schema enforcements', 'Configure function calling to query external databases and APIs', 'Build multi-turn conversational agents with stateful history'], estimatedHours: '60–80 hours' },
      { stage: 'Phase 3: RAG & Quantitative Evaluation', milestones: ['Build vector retrieval pipelines with embeddings and chunking strategies', 'Benchmark answer relevance and faithfulness using automated evaluators', 'Optimize prompt tokens to reduce production API costs'], estimatedHours: '70–90 hours' },
    ],
    projects: [
      { title: 'Domain-Specific RAG Research Assistant', description: 'Create a knowledge-base QA system with document ingestion, semantic search, and hallucination guardrails.', skillsPracticed: ['Python', 'Vector DB', 'RAG', 'Structured Prompts'], deliverable: 'Interactive prototype with evaluation scorecards' },
      { title: 'Automated Prompt Evaluation & Regression Suite', description: 'Build a test framework that benchmarks prompt iterations across accuracy, latency, and token consumption.', skillsPracticed: ['Python', 'Prompt Metrics', 'JSON Schemas', 'LLM Benchmarking'], deliverable: 'Test runner script generating comparative markdown reports' },
    ],
  },
  'ar/vr developer': {
    title: 'AR/VR Developer',
    description: 'Builds immersive virtual reality and augmented reality experiences, spatial user interfaces, and interactive 3D simulations.',
    technicalSkills: ['Unity or Unreal Engine', 'C# or C++', '3D Math (Vectors, Quaternions, Matrices)', 'Spatial UI/UX & Interaction Design', 'OpenXR & Meta Quest / VisionOS SDKs', 'Shader Programming & HLSL / Shader Graph', 'Real-time 3D Asset Optimization', 'Spatial Audio Integration'],
    professionalSkills: ['Ergonomics & Motion Sickness Mitigation', 'Iterative User Testing in 3D', 'Cross-Disciplinary Art & Code Collaboration'],
    roadmap: [
      { stage: 'Phase 1: Real-Time 3D & Engine Basics', milestones: ['Master Unity or Unreal fundamentals, scenes, transforms, and physics', 'Learn C# scripting for object lifecycles and event systems', 'Understand 3D vector geometry and coordinate spaces'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 2: XR Interactions & Hardware SDKs', milestones: ['Set up OpenXR framework for cross-platform headset compatibility', 'Implement grab, ray-cast, and teleport mechanics', 'Design spatial user interfaces suited for hand tracking and controllers'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 3: Optimization & Immersive Polish', milestones: ['Profile frame rates to maintain fixed 90+ FPS and avoid disorientation', 'Implement occlusion, spatial audio, and dynamic lighting', 'Build cross-device WebXR or standalone Quest packages'], estimatedHours: '80–110 hours' },
    ],
    projects: [
      { title: 'Interactive VR Workspace & Training Room', description: 'Build an immersive virtual room where users manipulate 3D machinery parts with tactile haptic feedback.', skillsPracticed: ['Unity/C#', 'OpenXR', 'Physics', 'Spatial Audio'], deliverable: 'Playable headset build (.apk / executable) with demo video' },
      { title: 'AR Spatial Interior Decorator', description: 'Develop a mobile or headset AR app that places true-to-scale 3D furniture into physical rooms with plane detection.', skillsPracticed: ['AR Foundation', 'C#', 'Plane Tracking', 'Spatial UI'], deliverable: 'Mobile AR application package with user interaction guide' },
    ],
  },
  'renewable energy analyst': {
    title: 'Renewable Energy Analyst',
    description: 'Analyzes meteorological data, energy grid metrics, solar/wind resource potential, and financial viability for clean energy projects.',
    technicalSkills: ['Python & pandas / NumPy', 'GIS & Geospatial Analysis (QGIS, GeoPandas)', 'Energy Modeling Software (SAM, PVsyst, or HOMER)', 'Statistical Forecasting & Time Series Analysis', 'Electricity Market Regulations & PPA Economics', 'SQL & Energy Data Pipelines', 'Data Visualization (PowerBI / Tableau / Plotly)', 'Carbon Accounting & Life-Cycle Assessment (LCA)'],
    professionalSkills: ['Techno-Economic Feasibility Reporting', 'Stakeholder & Utility Negotiation', 'Environmental Policy Interpretation'],
    roadmap: [
      { stage: 'Phase 1: Clean Energy Systems & Data Analytics', milestones: ['Fundamentals of solar PV, wind turbines, and battery storage mechanics', 'Data manipulation and time-series analysis with Python and pandas', 'Understanding grid dispatch and Levelized Cost of Energy (LCOE)'], estimatedHours: '60–80 hours' },
      { stage: 'Phase 2: Geospatial Analysis & Resource Assessment', milestones: ['Map solar irradiance and wind velocity using GIS and open satellite data', 'Simulate annual generation yields using NREL SAM or PVsyst', 'Model battery degradation and peak shaving economics'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 3: Grid Integration & Financial Modeling', milestones: ['Analyze electricity market pricing and power purchase agreements (PPAs)', 'Conduct carbon offset accounting and life-cycle emission evaluations', 'Present interactive dashboards to non-technical stakeholders'], estimatedHours: '70–90 hours' },
    ],
    projects: [
      { title: 'Solar PV Site Feasibility & LCOE Calculator', description: 'Analyze regional solar radiation datasets to calculate annual generation yield, payback period, and avoided carbon emissions.', skillsPracticed: ['Python', 'GeoPandas', 'SAM APIs', 'LCOE Modeling'], deliverable: 'Jupyter notebook model with interactive yield maps' },
      { title: 'Renewable Grid Curtailment & Storage Dashboard', description: 'Build an interactive dashboard tracking hourly grid supply, wind curtailment events, and battery dispatch optimization.', skillsPracticed: ['Plotly/Streamlit', 'Time Series', 'SQL', 'Energy Economics'], deliverable: 'Live web dashboard summarizing storage financial returns' },
    ],
  },
  'technical writer': {
    title: 'Technical Writer & Documentation Specialist',
    description: 'Authors clear, comprehensive technical documentation, API references, tutorials, and architecture guides for developers and enterprise users.',
    technicalSkills: ['Markdown, MDX & AsciiDoc', 'Docs-as-Code Workflows (Git, GitHub, PRs)', 'Static Site Generators (Docusaurus, VitePress, Hugo)', 'API Documentation (OpenAPI / Swagger, Postman)', 'Code Literacy (Reading Python / JS / REST APIs)', 'Content Information Architecture & Style Guides', 'Screenshot & Diagramming Tools (Mermaid.js, Figma)', 'SEO for Technical Knowledge Bases'],
    professionalSkills: ['Simplifying Complex Engineering Abstractions', 'Developer Empathy & User Research', 'Collaboration with Engineering Teams'],
    roadmap: [
      { stage: 'Phase 1: Foundations of Technical Communication', milestones: ['Learn Docs-as-Code workflows with Git and GitHub PR reviews', 'Master clear, active-voice technical writing and Microsoft/Google style guides', 'Structure effective quickstarts, conceptual overviews, and tutorials'], estimatedHours: '50–70 hours' },
      { stage: 'Phase 2: API Documentation & Static Generators', milestones: ['Read and document REST endpoints from codebases and Swagger/OpenAPI files', 'Build and customize doc sites using Docusaurus or VitePress', 'Incorporate interactive code blocks and architectural Mermaid diagrams'], estimatedHours: '60–80 hours' },
      { stage: 'Phase 3: Documentation Operations & Information Architecture', milestones: ['Design scalable navigation hierarchies and taxonomy for large documentation sets', 'Set up automated link checking, spelling, and prose linting in CI/CD (Vale)', 'Conduct usability audits on developer onboarding journeys'], estimatedHours: '60–80 hours' },
    ],
    projects: [
      { title: 'Production Developer Documentation Portal', description: 'Deploy a complete documentation site featuring getting-started guides, API specifications, and troubleshooting trees.', skillsPracticed: ['Docusaurus', 'OpenAPI', 'Markdown', 'Git Workflow'], deliverable: 'Published doc portal with automated search and GitHub Actions CI' },
      { title: 'Comprehensive API Reference & SDK Tutorial', description: 'Document an open-source REST API with executable curl snippets, response schemas, and common error resolutions.', skillsPracticed: ['Swagger', 'Postman', 'Information Architecture', 'Prose Linting'], deliverable: 'OpenAPI 3.1 spec and developer walkthrough guide' },
    ],
  },
  'data scientist': {
    title: 'Data Scientist',
    description: 'Extracts actionable insights from complex datasets using advanced statistical modeling, machine learning, and data visualization.',
    technicalSkills: ['Python (NumPy, pandas, Scikit-Learn)', 'Applied Statistics & Hypothesis Testing (A/B Testing)', 'SQL & Complex Data Joins', 'Data Visualization (Seaborn, Matplotlib, Plotly)', 'Machine Learning (Regression, Classification, Clustering)', 'Jupyter Notebook Workflows', 'Business Metrics & KPI Modeling'],
    professionalSkills: ['Data Storytelling for Leadership', 'Curiosity & Investigative Mindset', 'Cross-Functional Collaboration'],
    roadmap: [
      { stage: 'Phase 1: Statistics & Python Analytics', milestones: ['Statistical distributions, hypothesis testing, and confidence intervals', 'Data wrangling and exploratory data analysis (EDA) with pandas', 'Advanced SQL querying (window functions, CTEs)'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 2: Predictive Modeling & ML', milestones: ['Supervised and unsupervised learning with Scikit-Learn', 'Feature engineering and handling imbalanced datasets', 'A/B testing experimental design and sample size calculation'], estimatedHours: '80–100 hours' },
      { stage: 'Phase 3: Advanced Analytics & Product Impact', milestones: ['Time-series forecasting and anomaly detection', 'Building self-service reporting dashboards', 'Communicating analytical findings to executive stakeholders'], estimatedHours: '70–90 hours' },
    ],
    projects: [
      { title: 'Customer Lifetime Value & Churn Prediction', description: 'Perform exploratory analysis, train predictive classifiers, and segment user cohorts based on purchase recency and frequency.', skillsPracticed: ['pandas', 'Scikit-Learn', 'SQL', 'Seaborn'], deliverable: 'Jupyter analysis with actionable executive summary slides' },
      { title: 'A/B Testing Experiment Analysis Tool', description: 'Build an automated statistical tool that verifies sample ratio mismatch, calculates p-values, and plots lift distributions.', skillsPracticed: ['Python', 'Statistics', 'A/B Testing', 'Plotly'], deliverable: 'Reproducible statistical testing package with report generator' },
    ],
  },
  'ux designer': {
    title: 'UX Designer',
    description: 'Researches user needs, designs intuitive workflows, and crafts responsive user experiences from wireframes to high-fidelity prototypes.',
    technicalSkills: ['Figma / FigJam', 'User Research & Interviewing', 'Wireframing & Interactive Prototyping', 'Usability Testing & Feedback Synthesis', 'Information Architecture & Journey Mapping', 'Design Systems & Component Libraries', 'Web Accessibility (WCAG 2.1 Guidelines)'],
    professionalSkills: ['User Empathy & Active Listening', 'Facilitating Design Sprints', 'Articulating Design Rationale to Engineers'],
    roadmap: [
      { stage: 'Phase 1: User Research & IA', milestones: ['Conduct qualitative user interviews and create grounded personas', 'Map user flows, edge cases, and site information architecture', 'Sketch low-fidelity paper wireframes and user journeys'], estimatedHours: '60–80 hours' },
      { stage: 'Phase 2: Figma Mastery & Prototyping', milestones: ['Master Figma auto-layout, components, variants, and design tokens', 'Build clickable high-fidelity interactive prototypes', 'Design accessible contrast ratios and keyboard navigation flows'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 3: Usability Testing & Systems', milestones: ['Conduct moderated and unmoderated usability tests', 'Synthesize feedback into actionable heuristic improvement plans', 'Contribute to a multi-brand responsive design system'], estimatedHours: '70–90 hours' },
    ],
    projects: [
      { title: 'Mobile Wellness App End-to-End Case Study', description: 'Design a mobile health application from initial user research interviews to high-fidelity clickable prototype.', skillsPracticed: ['Figma', 'User Research', 'Prototyping', 'WCAG Accessibility'], deliverable: 'Comprehensive Behance / PDF portfolio case study' },
      { title: 'E-Commerce Checkout Redesign & Usability Audit', description: 'Audit an existing checkout flow, identify cognitive friction points, and test an improved zero-distraction redesign.', skillsPracticed: ['Heuristic Evaluation', 'Wireframing', 'A/B Prototype', 'Usability Testing'], deliverable: 'Usability findings report with interactive Figma prototype' },
    ],
  },
  'product manager': {
    title: 'Product Manager',
    description: 'Defines product vision, prioritizes roadmaps, aligns engineering with business goals, and drives user-centric feature execution.',
    technicalSkills: ['Product Roadmapping & Prioritization (RICE / MoSCoW)', 'Writing Clear PRDs & User Stories', 'Data Analytics & Metric Definition (North Star, Funnels)', 'Agile / Scrum Sprint Leadership', 'Competitive & Market Landscaping', 'A/B Testing & Feature Experimentation', 'Basic SQL & Technical Architecture Literacy'],
    professionalSkills: ['Stakeholder Alignment & Influence Without Authority', 'Strategic Decision-Making Under Uncertainty', 'Clear Written & Oral Communication'],
    roadmap: [
      { stage: 'Phase 1: Product Discovery & Strategy', milestones: ['Define customer problem statements and value propositions', 'Formulate North Star metrics and leading product KPIs', 'Conduct competitive landscape and TAM/SAM market research'], estimatedHours: '60–80 hours' },
      { stage: 'Phase 2: Execution & Agile Delivery', milestones: ['Author comprehensive Product Requirement Documents (PRDs)', 'Break down high-level initiatives into user stories and acceptance criteria', 'Facilitate backlog grooming, sprint planning, and retrospective sessions'], estimatedHours: '70–90 hours' },
      { stage: 'Phase 3: Growth & Product Analytics', milestones: ['Track retention cohorts and user conversion funnels', 'Design and evaluate hypothesis-driven A/B experimentation', 'Coordinate cross-functional go-to-market launches with marketing and sales'], estimatedHours: '70–90 hours' },
    ],
    projects: [
      { title: 'Comprehensive PRD & Go-to-Market Spec', description: 'Author a complete Product Requirements Document for a mobile safety feature, including user stories and telemetry metrics.', skillsPracticed: ['PRD Writing', 'Metric Definition', 'User Personas', 'Roadmapping'], deliverable: 'Full PRD document and launch roadmap ready for engineering review' },
      { title: 'Feature Prioritization & Retention Analysis', description: 'Analyze simulated user cohort data, calculate feature RICE scores, and justify a quarterly feature roadmap.', skillsPracticed: ['RICE Scoring', 'Funnel Analysis', 'Stakeholder Deck'], deliverable: 'Strategic product presentation deck with data-backed roadmap' },
    ],
  },
  'digital marketer': {
    title: 'Digital Marketer',
    description: 'Plans and optimizes customer acquisition, retention, content campaigns, and performance marketing across digital channels.',
    technicalSkills: ['Search Engine Optimization (SEO)', 'Google Analytics (GA4) & Tag Manager', 'Paid Search (Google Ads)', 'Paid Social (Meta Ads Manager / LinkedIn Ads)', 'Email Marketing Automation (Klaviyo / Mailchimp)', 'Content Strategy & Copywriting', 'Conversion Rate Optimization (CRO) & A/B Testing'],
    professionalSkills: ['Data-Driven Creative Ideation', 'Customer Persona Empathy', 'Marketing ROI Budget Management'],
    roadmap: [
      { stage: 'Phase 1: Marketing Fundamentals & Content', milestones: ['Define buyer personas, sales funnels, and customer journeys', 'Master on-page and technical SEO keyword research', 'Craft engaging social media copy and long-form authority articles'], estimatedHours: '50–70 hours' },
      { stage: 'Phase 2: Paid Channels & Performance', milestones: ['Set up search campaign keyword bidding and quality score optimization', 'Build targeted Meta ad sets with audience lookalikes', 'Analyze campaign metrics (CAC, ROAS, CTR, Conversion Rate)'], estimatedHours: '60–80 hours' },
      { stage: 'Phase 3: Retention, Analytics & CRO', milestones: ['Configure GA4 custom event tracking and conversion funnels', 'Build automated email nurture and re-engagement drips', 'Run landing page A/B tests to optimize conversion rates'], estimatedHours: '60–80 hours' },
    ],
    projects: [
      { title: 'Multi-Channel Acquisition & SEO Strategy', description: 'Develop a 90-day organic and paid marketing campaign playbook for a new women empowerment initiative.', skillsPracticed: ['SEO Audit', 'Content Strategy', 'Paid Media Budgeting', 'GA4 Tracking'], deliverable: 'Complete campaign playbook with projected ROAS and KPIs' },
      { title: 'Email Nurture Sequence & Landing Page CRO', description: 'Design a 5-step automated onboarding email sequence coupled with an optimized landing page wireframe.', skillsPracticed: ['Copywriting', 'Email Automation', 'CRO Principles', 'A/B Testing'], deliverable: 'Copy doc with automation trigger diagrams and conversion benchmarks' },
    ],
  },
};

// ── DOMAIN FALLBACK GENERATOR FOR ARBITRARY SPECIALIZED ROLES ────────────────

function generateCurriculumForArbitraryRole(targetRole) {
  const norm = targetRole.toLowerCase();

  // Try direct or partial match in knowledge base first
  for (const [key, data] of Object.entries(ROLE_KNOWLEDGE_BASE)) {
    if (norm.includes(key) || key.includes(norm)) {
      return data;
    }
  }

  // Decompose keywords to build an intelligent, domain-appropriate analysis
  const isSecurity = /security|cyber|penetration|threat|audit|soc/i.test(norm);
  const isAI = /ai|artificial intelligence|ml|machine learning|deep learning|vision|nlp|llm/i.test(norm);
  const isCloud = /cloud|aws|azure|gcp|devops|sre|kubernetes|infrastructure/i.test(norm);
  const isData = /data|analytics|bi|intelligence|statistic|quant/i.test(norm);
  const isCode = /developer|engineer|programmer|software|frontend|backend|fullstack|web|mobile/i.test(norm);
  const isBio = /bio|genom|health|med|clinic|pharma/i.test(norm);
  const isHardware = /robot|embed|hardware|iot|sensor|mechanical/i.test(norm);
  const isDesign = /design|ux|ui|product design|creative|visual/i.test(norm);
  const isWriting = /writer|writing|content|doc|author/i.test(norm);
  const isManagement = /manager|lead|director|product manager|scrum/i.test(norm);

  const titleCased = targetRole
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const technicalSkills = [];
  const professionalSkills = ['Cross-Disciplinary Communication', 'Problem Decomposition', 'Continuous Learning & Research', 'Technical Documentation'];
  const roadmapStages = [];

  // Compose technical skills dynamically
  if (isSecurity) {
    technicalSkills.push('Threat Modeling & Vulnerability Assessment', 'Secure Coding & Cryptography Basics', 'Network & Application Security Auditing', 'Security Monitoring & Incident Response');
  }
  if (isAI) {
    technicalSkills.push('Python for Machine Learning', 'Model Evaluation & Validation', 'Working with Neural Networks or LLM APIs', 'Data Preprocessing & Feature Engineering');
  }
  if (isCloud) {
    technicalSkills.push('Cloud Infrastructure (AWS / Azure / GCP)', 'Infrastructure as Code (Terraform)', 'Containerization with Docker', 'CI/CD Automation Pipelines');
  }
  if (isData) {
    technicalSkills.push('SQL & Relational Data Querying', 'Data Visualization & Reporting', 'Exploratory Data Analysis', 'Statistical Modeling & Interpretation');
  }
  if (isBio) {
    technicalSkills.push('Biological Data Formats & NCBI/Ensembl Databases', 'Computational Data Analysis in Python / R', 'Statistical Genetics & Workflow Automation');
  }
  if (isHardware) {
    technicalSkills.push('Embedded Programming & Microcontrollers (C/C++)', 'Sensor Integration & Signal Processing', 'Kinematics & Hardware Control Systems');
  }
  if (isDesign) {
    technicalSkills.push('User Interface & Wireframing Tools (Figma)', 'User Research & Journey Mapping', 'Design Systems & Responsive Layouts', 'Usability Testing & Accessibility (WCAG)');
  }
  if (isWriting) {
    technicalSkills.push('Technical Documentation & Style Guides', 'Docs-as-Code Workflows (Git/Markdown)', 'API Documentation & Swagger/OpenAPI', 'Information Architecture for Technical Knowledge');
  }
  if (isManagement) {
    technicalSkills.push('Product / Project Roadmapping', 'Agile & Scrum Process Facilitation', 'Stakeholder Alignment & Metric Tracking', 'User Story Writing & Backlog Management');
  }

  // Baseline skills if none matched
  if (technicalSkills.length < 4) {
    if (isCode) {
      technicalSkills.push('Modern Programming (Python / JavaScript / TypeScript)', 'Git & Version Control Workflows', 'RESTful API & Database Integration', 'Automated Testing & Code Quality');
    } else {
      technicalSkills.push('Domain Technical Literacy & Tooling', 'Data Analysis & Quantitative Verification', 'Version Control & Digital Workflow Tools', 'Systemic Problem Solving');
    }
  }

  // Build roadmap
  roadmapStages.push({
    stage: 'Phase 1: Domain Core Fundamentals',
    milestones: [
      `Master core principles and foundational tooling required for ${titleCased}`,
      'Learn standard workflows, industry terminology, and version control',
      'Set up an active development and experimentation environment',
    ],
    estimatedHours: '60–80 hours',
  });
  roadmapStages.push({
    stage: 'Phase 2: Applied Technical Skills & Intermediate Projects',
    milestones: [
      `Implement practical end-to-end solutions specific to ${titleCased}`,
      'Deepen proficiency in required technical tools and frameworks',
      'Incorporate industry best practices, testing, and documentation',
    ],
    estimatedHours: '70–90 hours',
  });
  roadmapStages.push({
    stage: 'Phase 3: Portfolio & Production Specialization',
    milestones: [
      `Build a capstone portfolio project demonstrating mastery in ${titleCased}`,
      'Participate in open-source projects or domain community discussions',
      'Prepare technical case studies and interview-ready walkthroughs',
    ],
    estimatedHours: '80–100 hours',
  });

  const projects = [
    {
      title: `${titleCased} Capstone Case Study`,
      description: `Build an end-to-end, documented project solving a realistic problem encountered by a ${titleCased}.`,
      skillsPracticed: technicalSkills.slice(0, 3),
      deliverable: 'Public GitHub repository or portfolio case study with comprehensive documentation',
    },
    {
      title: 'Automated Domain Pipeline or Utility',
      description: `Develop a focused tool or analysis script that optimizes a routine task in ${titleCased} workflows.`,
      skillsPracticed: technicalSkills.slice(2, 5),
      deliverable: 'Tested codebase or interactive dashboard with benchmark results',
    },
  ];

  return {
    title: titleCased,
    description: `A specialized professional who combines technical domain knowledge and analytical methodologies to deliver impact as a ${titleCased}.`,
    technicalSkills,
    professionalSkills,
    roadmap: roadmapStages,
    projects,
  };
}

// ── REPUTABLE LEARNING PLATFORMS (NO FAKE / DEAD LINKS) ──────────────────────

const VERIFIED_LEARNING_RESOURCES = [
  {
    name: 'Official Documentation & Standards',
    description: 'The highest-quality, most accurate source of truth for syntax, architecture, and current industry conventions.',
    topics: ['Official language docs', 'Cloud vendor whitepapers', 'Standards (W3C, OWASP, ISO)'],
  },
  {
    name: 'University & Accredited Courses (Coursera / edX)',
    description: 'Rigorous academic foundations taught by leading universities with structured assignments and peer reviews.',
    topics: ['Computer Science foundations', 'Specialized domain tracks', 'Mathematics & statistical theory'],
  },
  {
    name: 'FreeCodeCamp & MDN Web Docs',
    description: 'World-renowned, completely free, interactive curriculum and comprehensive reference materials.',
    topics: ['Web standards', 'Full-stack development', 'Data analysis & algorithms'],
  },
  {
    name: 'Open-Source Projects on GitHub',
    description: 'Inspect real-world production codebases, study architecture patterns, and contribute pull requests.',
    topics: ['Code review experience', 'Collaborative engineering', 'Real-world bug triage'],
  },
];

// ── DETERMINISTIC ANALYSIS ENGINE ───────────────────────────────────────────

export function analyzeSkillGapDeterministic({
  targetRole,
  currentSkills = '',
  educationLevel = '',
  experienceLevel = '',
  careerGoal = '',
}) {
  const validation = validateCareerRoleInput(targetRole);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const cleanRole = validation.cleanRole;
  const curriculum = generateCurriculumForArbitraryRole(cleanRole);

  // Parse user's reported skills safely
  const rawReportedSkills = (currentSkills || '')
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 60);

  const normReported = rawReportedSkills.map((s) => s.toLowerCase());

  // Distinguish between:
  // 1. Confirmed skills (user reported and match core requirements)
  // 2. Gaps to fill (required skills not mentioned)
  // 3. Unverified / complementary skills (standard in role, but user hasn't explicitly mentioned)

  const confirmedSkills = [];
  const skillGaps = [];
  const unverifiedSkills = [];

  const allRequired = [...curriculum.technicalSkills, ...curriculum.professionalSkills];

  for (let i = 0; i < allRequired.length; i++) {
    const reqSkill = allRequired[i];
    const reqLower = reqSkill.toLowerCase();
    const keywords = reqLower.split(/[\s/()&]+/).filter((k) => k.length >= 3);

    const isMatch = normReported.some((userSkill) => {
      if (reqLower.includes(userSkill) || userSkill.includes(reqLower)) return true;
      return keywords.some((kw) => userSkill.includes(kw));
    });

    const isTechnical = curriculum.technicalSkills.includes(reqSkill);

    if (isMatch) {
      confirmedSkills.push(reqSkill);
    } else {
      // Prioritize: first 3 tech skills are High priority, next are Medium, soft skills are Medium/Low
      let priority = 'medium';
      if (isTechnical && i < 3) {
        priority = 'high';
      } else if (!isTechnical && i > 6) {
        priority = 'low';
      }

      skillGaps.push({
        skill: reqSkill,
        priority,
        category: isTechnical ? 'technical' : 'professional',
        reason: isTechnical
          ? `Fundamental capability essential for daily responsibilities in ${curriculum.title}.`
          : `High-impact professional competency needed for collaborative execution and project delivery.`,
      });
    }
  }

  // Include user reported skills that didn't directly match as confirmed transferrable skills
  for (const reported of rawReportedSkills) {
    if (!confirmedSkills.some((c) => c.toLowerCase().includes(reported.toLowerCase()))) {
      confirmedSkills.push(`${reported} (Transferrable)`);
    }
  }

  // Add standard complementary skills to unverifiedSkills
  if (curriculum.technicalSkills.length > 5) {
    const extraTech = curriculum.technicalSkills.slice(4);
    for (const s of extraTech) {
      if (!confirmedSkills.includes(s) && !skillGaps.some((g) => g.skill === s)) {
        unverifiedSkills.push(s);
      }
    }
  }

  // Calculate transparent readiness score
  const totalCore = allRequired.length;
  const matchedCoreCount = allRequired.filter((req) => {
    const reqLower = req.toLowerCase();
    const keywords = reqLower.split(/[\s/()&]+/).filter((k) => k.length >= 3);
    return normReported.some((us) => reqLower.includes(us) || keywords.some((kw) => us.includes(kw)));
  }).length;

  let readinessScore = 0;
  if (totalCore > 0) {
    readinessScore = Math.min(100, Math.round((matchedCoreCount / totalCore) * 100));
  }

  // Give a small baseline if user reported transferrable skills even if no direct match
  if (readinessScore === 0 && rawReportedSkills.length > 0) {
    readinessScore = Math.min(25, rawReportedSkills.length * 5);
  }

  let readinessLevel = 'Early Stage';
  if (readinessScore >= 80) readinessLevel = 'Job Ready';
  else if (readinessScore >= 50) readinessLevel = 'Intermediate';
  else if (readinessScore >= 25) readinessLevel = 'Foundational';

  const hasMissingProfile = rawReportedSkills.length === 0;

  const limitations = hasMissingProfile
    ? 'Personalization is limited because no current skills or experience were provided. The analysis displays standard market benchmarks for this role.'
    : 'Readiness score is an algorithmic estimate based on self-reported skills against market benchmarks. Real-world job readiness also depends on hands-on project portfolio depth and interview presentation.';

  return {
    targetRole: curriculum.title,
    roleDescription: curriculum.description,
    requiredTechnicalSkills: curriculum.technicalSkills,
    requiredProfessionalSkills: curriculum.professionalSkills,
    userReportedSkills: rawReportedSkills,
    confirmedSkills,
    skillGaps,
    unverifiedSkills,
    learningRoadmap: curriculum.roadmap,
    projectRecommendations: curriculum.projects,
    learningResources: VERIFIED_LEARNING_RESOURCES,
    readinessAssessment: {
      score: readinessScore,
      level: readinessLevel,
      summary: hasMissingProfile
        ? `No existing skills reported. Start with Phase 1 of the learning roadmap to build core competencies for ${curriculum.title}.`
        : `You possess ${matchedCoreCount} of ${totalCore} primary benchmark skills (${readinessScore}% match). Focusing on the High-Priority gaps will yield the highest career acceleration.`,
      assumptionsAndLimitations: limitations,
    },
    analysisSource: 'curriculum_engine',
  };
}

// ── GEMINI AI INTEGRATION WITH AUTOMATIC FALLBACK ───────────────────────────

export async function analyzeSkillGap({
  targetRole,
  currentSkills = '',
  educationLevel = '',
  experienceLevel = '',
  careerGoal = '',
}) {
  const validation = validateCareerRoleInput(targetRole);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const cleanRole = validation.cleanRole;

  // 1. If Gemini AI is configured, attempt contextual LLM synthesis
  if (geminiModel) {
    try {
      const prompt = `You are an expert career and skills analyst for HerGuardian AI.
Analyze the target career role and user profile below. Return ONLY a single valid JSON object with NO markdown formatting, NO backticks.

Target Career Role: "${cleanRole}"
User Reported Skills: "${(currentSkills || '').trim() || 'None provided'}"
Education: "${(educationLevel || '').trim() || 'Not specified'}"
Experience Level: "${(experienceLevel || '').trim() || 'Not specified'}"
Career Goal: "${(careerGoal || '').trim() || 'Not specified'}"

JSON Schema:
{
  "targetRole": "${cleanRole}",
  "roleDescription": "2-3 concise sentences explaining what this role does in modern industry.",
  "requiredTechnicalSkills": ["Skill 1", "Skill 2", ... 6-8 core technical skills],
  "requiredProfessionalSkills": ["Soft Skill 1", "Soft Skill 2", ... 3-4 professional skills],
  "userReportedSkills": [list of strings of skills user actually provided, empty if none provided],
  "confirmedSkills": [skills from user profile that match or transfer to this role],
  "skillGaps": [
    {
      "skill": "Skill name",
      "priority": "high" or "medium" or "low",
      "category": "technical" or "professional",
      "reason": "Specific rationale why this skill is needed for this role"
    }
  ],
  "unverifiedSkills": [skills standard for role that user didn't mention],
  "learningRoadmap": [
    {
      "stage": "Phase 1: Foundations",
      "milestones": ["Milestone 1", "Milestone 2", "Milestone 3"],
      "estimatedHours": "e.g. 60-80 hours"
    },
    {
      "stage": "Phase 2: Applied Practice",
      "milestones": ["Milestone 1", "Milestone 2", "Milestone 3"],
      "estimatedHours": "e.g. 70-90 hours"
    },
    {
      "stage": "Phase 3: Portfolio & Production",
      "milestones": ["Milestone 1", "Milestone 2", "Milestone 3"],
      "estimatedHours": "e.g. 80-100 hours"
    }
  ],
  "projectRecommendations": [
    {
      "title": "Project Name",
      "description": "2 sentences describing a realistic beginner-friendly portfolio project",
      "skillsPracticed": ["Skill 1", "Skill 2"],
      "deliverable": "Concrete deliverable"
    },
    {
      "title": "Project Name 2",
      "description": "Project 2 description",
      "skillsPracticed": ["Skill 3", "Skill 4"],
      "deliverable": "Concrete deliverable"
    }
  ],
  "readinessAssessment": {
    "score": integer between 0 and 100 representing realistic readiness percentage,
    "level": "Early Stage" or "Foundational" or "Intermediate" or "Job Ready",
    "summary": "1-2 sentences summarizing readiness",
    "assumptionsAndLimitations": "Transparent note on assumptions and limitations"
  }
}

CRITICAL RULES:
- Never invent skills or work experience that the user did not state.
- If user reported skills is empty, score must be <= 15 and explicitly state that personalization is limited.
- Do not provide dead or fabricated URLs.`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 9000)
      );

      const geminiPromise = geminiModel.generateContent(prompt);
      const resp = await Promise.race([geminiPromise, timeoutPromise]);
      const rawText = resp.response.text();

      // Clean markdown code blocks if any
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && parsed.targetRole && Array.isArray(parsed.requiredTechnicalSkills)) {
        return {
          ...parsed,
          learningResources: VERIFIED_LEARNING_RESOURCES,
          analysisSource: 'ai',
        };
      }
    } catch (err) {
      console.warn('[SkillGapAnalyzer] Gemini AI generation notice:', err.message, '- Using curriculum engine fallback.');
    }
  }

  // 2. Fallback to comprehensive curriculum engine
  return analyzeSkillGapDeterministic({
    targetRole: cleanRole,
    currentSkills,
    educationLevel,
    experienceLevel,
    careerGoal,
  });
}

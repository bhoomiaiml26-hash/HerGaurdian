/**
 * skillGapAnalyzer.test.js
 * Comprehensive tests for the HerGuardian AI Skill Gap Analyzer.
 *
 * Covers all requirements in Part D:
 * 1. Currently supported role
 * 2. Unsupported but valid technical role
 * 3. Niche or interdisciplinary career
 * 4. Two different roles produce distinct skills and roadmaps
 * 5. User profile containing existing skills
 * 6. Missing profile information
 * 7. Empty and invalid inputs
 * 8. Unavailable AI service fallback
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCareerRoleInput,
  analyzeSkillGapDeterministic,
  ROLE_KNOWLEDGE_BASE,
} from '../src/services/skillGapAnalyzer.js';

describe('Skill Gap Analyzer — Input Validation & Edge Cases', () => {
  it('should reject empty or null input with clear message', () => {
    const r1 = validateCareerRoleInput('');
    assert.equal(r1.isValid, false);
    assert.ok(r1.message.includes('Please enter a target career role'));

    const r2 = validateCareerRoleInput(null);
    assert.equal(r2.isValid, false);

    const r3 = validateCareerRoleInput('   ');
    assert.equal(r3.isValid, false);
  });

  it('should reject single-character or too short inputs', () => {
    const res = validateCareerRoleInput('a');
    assert.equal(res.isValid, false);
    assert.ok(res.message.includes('too short'));
  });

  it('should reject inputs exceeding length limit', () => {
    const longString = 'A'.repeat(160);
    const res = validateCareerRoleInput(longString);
    assert.equal(res.isValid, false);
    assert.ok(res.message.includes('maximum length'));
  });

  it('should reject nonsensical or keyboard spam input', () => {
    const res1 = validateCareerRoleInput('asdfghjklqwerty');
    assert.equal(res1.isValid, false);
    assert.ok(res1.message.includes('valid career title'));

    const res2 = validateCareerRoleInput('123456789');
    assert.equal(res2.isValid, false);

    const res3 = validateCareerRoleInput('zzzzzzzz');
    assert.equal(res3.isValid, false);
  });

  it('should accept valid and emerging career titles', () => {
    const roles = [
      'Software Engineer',
      'AI Security Engineer',
      'Cloud Security Architect',
      'Blockchain Developer',
      'Robotics Engineer',
      'Bioinformatics Analyst',
      'Prompt Engineer',
      'AR/VR Developer',
      'Renewable Energy Analyst',
      'Technical Writer',
    ];
    for (const role of roles) {
      const res = validateCareerRoleInput(role);
      assert.equal(res.isValid, true, `Role "${role}" should be valid`);
      assert.equal(res.cleanRole, role);
    }
  });
});

describe('Skill Gap Analyzer — Role-Agnostic Capability & Completeness', () => {
  it('1. Analyzes a traditionally supported role (Software Engineer)', () => {
    const res = analyzeSkillGapDeterministic({
      targetRole: 'Software Engineer',
      currentSkills: 'Python, Git',
    });

    assert.equal(res.targetRole, 'Software Engineer');
    assert.ok(res.roleDescription.length > 20);
    assert.ok(res.requiredTechnicalSkills.length >= 4);
    assert.ok(res.confirmedSkills.length >= 2, 'Should confirm Python and Git');
    assert.ok(res.skillGaps.length > 0, 'Should have skill gaps for unpossessed skills');
    assert.ok(res.learningRoadmap.length >= 3, 'Should have >= 3 roadmap stages');
    assert.ok(res.projectRecommendations.length >= 2, 'Should have >= 2 projects');
    assert.ok(res.learningResources.length > 0, 'Should have learning resources');
    assert.ok(typeof res.readinessAssessment.score === 'number');
  });

  it('2. Analyzes an unsupported but valid emerging technical role (AI Security Engineer)', () => {
    const res = analyzeSkillGapDeterministic({
      targetRole: 'AI Security Engineer',
      currentSkills: 'Python, Web Security',
    });

    assert.equal(res.targetRole, 'AI Security Engineer');
    assert.ok(res.roleDescription.toLowerCase().includes('machine learning') || res.roleDescription.toLowerCase().includes('model'));
    const tech = res.requiredTechnicalSkills.map((s) => s.toLowerCase());
    assert.ok(
      tech.some((s) => s.includes('adversarial') || s.includes('prompt injection') || s.includes('owasp') || s.includes('pytorch')),
      'Should include AI security specific skills'
    );
    assert.ok(res.learningRoadmap.length >= 3);
  });

  it('3. Analyzes a niche or interdisciplinary career (Bioinformatics Analyst)', () => {
    const res = analyzeSkillGapDeterministic({
      targetRole: 'Bioinformatics Analyst',
      currentSkills: 'Python, Biology basics',
    });

    assert.equal(res.targetRole, 'Bioinformatics Analyst');
    const tech = res.requiredTechnicalSkills.map((s) => s.toLowerCase());
    assert.ok(
      tech.some((s) => s.includes('ngs') || s.includes('genomic') || s.includes('biopython') || s.includes('rna-seq')),
      'Should include bioinformatics specific tools'
    );
  });

  it('4. Analyzes arbitrary specialized role (e.g. Cloud Security Architect, Renewable Energy Analyst)', () => {
    const res = analyzeSkillGapDeterministic({
      targetRole: 'Renewable Energy Analyst',
      currentSkills: 'Excel, SQL',
    });

    assert.equal(res.targetRole, 'Renewable Energy Analyst');
    const tech = res.requiredTechnicalSkills.map((s) => s.toLowerCase());
    assert.ok(
      tech.some((s) => s.includes('energy') || s.includes('solar') || s.includes('gis') || s.includes('time series')),
      'Should include renewable energy skills'
    );
  });

  it('5. Two different roles produce distinct, non-identical skills and roadmaps', () => {
    const role1 = analyzeSkillGapDeterministic({ targetRole: 'Blockchain Developer' });
    const role2 = analyzeSkillGapDeterministic({ targetRole: 'UX Designer' });

    assert.notEqual(role1.targetRole, role2.targetRole);
    assert.notEqual(role1.roleDescription, role2.roleDescription);
    assert.notDeepEqual(role1.requiredTechnicalSkills, role2.requiredTechnicalSkills);
    assert.notDeepEqual(role1.projectRecommendations, role2.projectRecommendations);
    assert.ok(
      role1.requiredTechnicalSkills.some((s) => s.toLowerCase().includes('solidity') || s.toLowerCase().includes('smart contract')),
      'Blockchain must include Solidity/smart contracts'
    );
    assert.ok(
      role2.requiredTechnicalSkills.some((s) => s.toLowerCase().includes('figma') || s.toLowerCase().includes('wireframing')),
      'UX must include Figma/wireframing'
    );
  });

  it('6. Accurately reflects user profile skills and does not invent unmentioned skills', () => {
    const res = analyzeSkillGapDeterministic({
      targetRole: 'Data Scientist',
      currentSkills: 'Python, SQL, pandas',
    });

    assert.deepEqual(res.userReportedSkills, ['Python', 'SQL', 'pandas']);
    // Confirmed skills should include Python, SQL, pandas
    const confirmed = res.confirmedSkills.map((s) => s.toLowerCase());
    assert.ok(confirmed.some((s) => s.includes('python')));
    assert.ok(confirmed.some((s) => s.includes('sql')));
    assert.ok(confirmed.some((s) => s.includes('pandas')));

    // High priority gaps must not include what user already has
    const gapSkills = res.skillGaps.map((g) => g.skill.toLowerCase());
    assert.ok(!gapSkills.includes('python'), 'Python should NOT be a gap');
  });

  it('7. Handles missing profile information with transparent disclaimer and low score', () => {
    const res = analyzeSkillGapDeterministic({
      targetRole: 'Machine Learning Engineer',
      currentSkills: '',
    });

    assert.equal(res.readinessAssessment.score, 0);
    assert.equal(res.readinessAssessment.level, 'Early Stage');
    assert.ok(
      res.readinessAssessment.assumptionsAndLimitations.includes('Personalization is limited'),
      'Must state that personalization is limited'
    );
    assert.equal(res.confirmedSkills.length, 0);
  });

  it('8. Fallback analysis source is clearly labeled as curriculum_engine', () => {
    const res = analyzeSkillGapDeterministic({
      targetRole: 'Technical Writer',
      currentSkills: 'Markdown',
    });

    assert.equal(res.analysisSource, 'curriculum_engine');
    assert.ok(res.readinessAssessment.assumptionsAndLimitations.length > 10);
  });
});

# City-search providers

`companyBoards.json` is deliberately limited to public Greenhouse boards whose endpoints were verified to respond. Its `hqCities` arrays are empty until a company-published source confirms a headquarters city; never infer these values from a board token.

To add a board:

1. Confirm the company publicly uses Greenhouse, Lever, or Ashby and identify its board token from its official careers page.
2. Check the provider's documented public postings endpoint and terms. Do not scrape HTML pages or use private endpoints.
3. Add the organization name, provider, exact board token, and only source-verified headquarters cities to `companyBoards.json`.
4. Confirm the public endpoint returns published jobs and that each result links to its original job/application URL.

Supported public endpoints:

- Greenhouse: `https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs?content=true`
- Lever: `https://api.lever.co/v0/postings/{boardToken}?mode=json`
- Ashby: `https://api.ashbyhq.com/posting-api/job-board/{boardToken}`

All board results are filtered against the requested city using the provider's location fields. Headquarters are descriptive config only and do not determine candidate eligibility.
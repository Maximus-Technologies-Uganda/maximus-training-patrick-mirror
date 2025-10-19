# Data Model: Week 7.5 Finish‑to‑Green

## Entities

### Post
- Fields: title, summary/body, publishedDate
- Notes: Rendered in list for first‑paint content

### Coverage Summary
- Fields: statementsPct, linesPct, functionsPct, branchesPct
- Notes: Displayed in CI summary block

### Review Packet
- Fields: a11yReportHtml (artifact), apiContract (artifact)
- Notes: Artifacts downloadable by reviewers

### Deployment Summary
- Fields: pipelineRunUrl, liveServiceUrl, timestamp
- Notes: Shown in deploy job summary

### Release
- Fields: tag (v7.0.x), notes, evidenceLinks
- Notes: Published for milestone close‑out

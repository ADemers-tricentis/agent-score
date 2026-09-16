## Meeting Information
> Date: 2026-09-11
> Location: [Insert Location]
> Participants: [Andrew] [Speaker 2] [Speaker 3]

## Meeting Notes
### Identity and Access Management
- Lior encountered issues with the identity system merge, currently requiring IT approval for each new internal user.
- Andrew raised concerns that this high-friction process will hinder user adoption.
- A temporary exception to the standard IT approval process will be requested to accelerate internal testing.
- The team clarified the distinction between the PM dev environment (`dotproduct.triosentus.com`) and the TAIS production environment.
- The team is using Tosca Cloud for identity, which is invite-based and should not require the same IT approvals.

### TAIS Deployment Progress and Blockers
- RDS and S3 infrastructure have been provisioned; Sohil is completing testing.
- The service will initially be deployed in TAIS as a monolith.
- Progress on helm charts is blocked by a PR from Marat that needs merging.
- Sohil is resizing memory for the scoring worker in staging and production, which were provisioned at a lower tier.
- A major blocker is the manual approval gates required for environment provisioning, including Dev.
- There are dependencies on Marat and Alan to resolve a database URL contract.
- A question remains about provisioning the SSL certificate and ensuring the callback URL is authorized by the Tosca Identity System.

### AI Hub Integration
- AI Hub integration is a major remaining task before completing the TAIS deployment.
- Lior will be assigned to the AI Hub integration, which includes five stories.
- Lior should be informed that the AI Hub v2 API is more standards-compliant, potentially simplifying integration.
- Andrew uses a Claude-based tool to track Lior’s PRs and Slack updates against Jira tasks to manage his workflow.

### User Experience and Onboarding Flow
- The user interface is incomplete, superseded by other priorities.
- A discussion is needed to define onboarding for users coming from Tosca Cloud.
- Key considerations include:
  - Default roles for new users.
  - Automating connection to AI Workspace using the tenant name from Tosca Cloud.
  - Defining the initial zero state and establishing an admin user to manage roles.
- The back-office UI is too technical for general users, highlighting the need for a user-friendly front-end.
- For now, AgentScore will automatically pull all data from a user’s connected AI Workspace.

## Next Arrangements
- [ ] Request a temporary exception to the IT approval process for internal user access.
- [ ] Andrew to coordinate with Lior to kick off AI Hub integration (five stories; note v2 API standards-compliance).
- [ ] Speaker 3 to unblock deployment steps:
  - [ ] Get Marat’s PR merged for helm chart progress.
  - [ ] Coordinate with Marat and Alan to finalize the database URL contract.
- [ ] Andrew to confirm the standard process with Marat for SSL certificate provisioning and Tosca Identity callback URL authorization.
- [ ] Andrew to schedule a workshop with Lior and Speaker 2 to define the new user onboarding flow (roles, AI Workspace auto-connection, zero state, admin setup).
- [ ] Andrew to draft a UX implementation plan for Lior to build the user interface.
- [ ] Andrew to send the meeting summary to all participants.

## AI Suggestions
> AI has identified the following issues that were not concluded in the meeting or lack clear action items; please pay attention:
> 1. Repeated delays in TAIS deployment due to manual approval gates remain a major issue; a concrete plan to address root causes was deferred until after the current deployment.
> 2. Role-based access control (RBAC) for the back office and the authorization model (e.g., who can invite users to AgentScore) must be defined to prevent unauthorized access to sensitive trace data.
> 3. While Lior is assigned to AI Hub and UI tasks, his tendency to work on unrequested features is a risk; there is no clear mitigation plan beyond Andrew’s tracking tool.
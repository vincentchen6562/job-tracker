# Job Application Tracker

A personal tracker for a graduate job search: one place to record every job applied for and where each one stands.

## Language

### Applications

**Application**:
One job being pursued: a company, a role, and everything tracked about pursuing it.
_Avoid_: App (that means the software), record, entry, job

**Company**:
The employer offering the role.
_Avoid_: employer, organisation

**Role**:
The job title as the employer advertised it.
_Avoid_: position, job title

**Job posting**:
The employer's advert for the role, kept as a link.
_Avoid_: listing, ad, vacancy

**Summary**:
A single line describing an application at a glance, shown on its card.
_Avoid_: notes, description, blurb

**Details**:
Free-form markdown notes on an application: research, contacts, interview prep, anything longer than a summary.
_Avoid_: notes, detail, body

**Priority**:
How much the application matters, from one to five stars; zero means not yet rated.
_Avoid_: rating, score

**Pending application**:
A newly added application that is still being filled in, held at the end of the list and out of sorting and filtering until editing ends.
_Avoid_: draft (it is already saved), new row

### Status

**Status**:
Where an application stands; always exactly one of Not started, In progress, Submitted, Interview, Offer, Rejected, Refused, No response, in that order.
_Avoid_: stage, state

**Rejected**:
The company said no, at any stage.
_Avoid_: declined, unsuccessful

**Refused**:
The applicant said no, at any stage: turning down an offer, or withdrawing before one.
_Avoid_: declined, withdrawn, turned down

**No response**:
The company never replied and the applicant stopped waiting.
_Avoid_: ghosted, expired, stale

### Facets

**Facet**:
A classification applications are filtered by: Category, Role type, or Location.
_Avoid_: tag, filter

**Category**:
The field of work a role belongs to, such as Software development or Security.
_Avoid_: industry, sector, field

**Role type**:
The kind of engagement a role is, such as Graduate programme, Internship, or Full-time.
_Avoid_: employment type, job type, contract type

**Location**:
A city the role is based in, or Remote; an application can have several.
_Avoid_: office, region

**Inferred facet**:
A facet value the tracker worked out from the role, summary and details because none was chosen; shown as "Auto".
_Avoid_: default, derived value, guess

**Explicit facet**:
A facet value that was chosen by hand and overrides inference.
_Avoid_: manual value, override

**Unspecified**:
The facet value when none was chosen and none could be inferred.
_Avoid_: unknown, none, other

### Accounts

**Account**:
A login that owns a set of applications.
_Avoid_: user, profile, member

**Demo account**:
A temporary account made for one visitor who wants to try the tracker; it starts with seed data and is deleted after a day.
_Avoid_: guest, trial, sandbox, demo user

### Moving data

**Backup**:
A single file holding every application in an account, made to be restored.
_Avoid_: export, dump, snapshot

**Restore**:
Replacing every application in an account with the contents of a backup.
_Avoid_: import, merge, sync

**Markdown export**:
A human-readable document of the applications currently shown; it cannot be restored.
_Avoid_: backup, report

**Seed data**:
The built-in set of example applications that a demo account starts with.
_Avoid_: sample data, default data, fixtures

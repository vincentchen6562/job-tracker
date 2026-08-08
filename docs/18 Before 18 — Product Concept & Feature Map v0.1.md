# 18 Before 18 — Product Concept & Feature Map v0.1

## Product Definition

**18 Before 18** is a gamified family financial learning platform built around real spending behaviour.

It helps teenagers build good financial habits by combining:

- Real money
- Real spending decisions
- Simulated future consequences
- Parent-child conversations
- AI-powered financial guidance

## Core Learning Loop

**Real money → Real decisions → Consequences → Conversation → Better habits**

The goal is not just to show where money went.

The goal is to help teenagers understand:

- What a spending decision means
- What trade-offs it creates
- How it affects future choices
- How to make better decisions next time

---

# Product Structure

The MVP has 3 main pages:

1. Landing Page
2. Parent Dashboard
3. Teen Dashboard

---

# 1. Landing Page

## Purpose

Explain the product clearly and onboard families.

## Core Features

- Hero pitch
- Interactive demo
- Parent view / Teen view preview
- How it works
- Comparison with normal expense tracking or parental-control apps
- Final CTA
- Sign-up / household creation

## Positioning

**Not a parental-control app.**

The product is designed around:

- Learning
- Conversation
- Independence
- Financial judgement

---

# 2. Parent Dashboard

## Purpose

Help parents create financial learning opportunities without micromanaging their children.

## Weekly Overview

Show the important family learning picture:

- Weekly deposit
- Bills and responsibilities
- Savings progress
- Safe-to-spend
- Outstanding commitments

## Privacy-Aware Spending View

Parents can see spending by category, rather than specific merchants or products.

Example:

- Food
- Entertainment
- Transport
- Subscriptions

Instead of:

> $18.50 spent at McDonald's

Show:

> $18.50 spent on Food

This protects the teenager's privacy while still giving parents enough context to support learning.

## AI Conversation Prompt

The system provides one useful conversation opportunity at a time.

Example:

> Alex used 65% of this week's flexible budget in the first two days.

Suggested conversation:

> "What would you do differently if an unexpected expense came up tomorrow?"

The purpose is to start a conversation, not create a surveillance feed.

## Graduated Independence

Parents can gradually hand over more financial responsibility.

Example:

### Level 1
- Pocket money
- Savings
- Entertainment

### Level 2
- Phone plan
- Transport
- Lunch

### Level 3
- Groceries
- Subscriptions
- Larger weekly budget

### Higher Independence
- More responsibility
- Fewer parent controls
- More self-management

Teenagers can also request more responsibility.

## Learning Summary

Parents can see high-level learning patterns such as:

- Bills paid on time
- Savings consistency
- Spending patterns
- BNPL / dark-pattern scenarios encountered
- Future money already committed
- Important learning moments

The report should be framed as a conversation starter, not a scorecard.

## Household Financial Visibility

Parents choose which household financial categories teenagers can see.

Possible categories:

- Housing
- Food
- Transport
- Utilities
- Subscriptions
- Savings

Parents do not need to reveal:

- Full income
- Mortgage details
- Exact account balances
- Sensitive transactions

The goal is to help teenagers understand how a household budget works without exposing the family's full financial situation.

---

# 3. Teen Dashboard

## Purpose

Let teenagers manage real money, experience realistic consequences, and gradually build financial independence.

## My Money Now

Show:

- Real balance
- Committed bills
- Savings commitments
- Safe-to-spend amount

Example:

| Item | Amount |
|---|---:|
| Balance | $180 |
| Upcoming bills | -$55 |
| Savings commitment | -$30 |
| **Safe to spend** | **$95** |

Core lesson:

> Money in the account is not always money available to spend.

## Bills and Responsibilities

Teenagers can manage responsibilities assigned by the parent.

Examples:

- Phone plan
- Transport
- Lunch
- Subscription
- Savings
- Groceries

Show:

- Due date
- Paid / unpaid status
- What happens if the bill is missed

The complexity grows with the teenager's independence level.

## Savings and Goals

Teenagers can create savings goals.

Example:

> Headphones — $300

The app shows how current spending affects the goal.

Example:

> Buy takeaway today → goal reached in 5 weeks

> Skip takeaway → goal reached in 4 weeks

The AI agent can help create a saving strategy based on:

- Current balance
- Weekly income
- Spending behaviour
- Goal amount
- Target date

The purpose is to build long-term thinking.

## What-If Simulator

Before making a financial decision, teenagers can simulate the future impact.

Example:

> What if I buy this $120 item?

The app shows:

- New balance
- Upcoming bills
- Savings impact
- Safe-to-spend impact
- Goal delay
- Future budget pressure

## BNPL / Family Advance Simulation

The product does not need to provide real credit.

Instead, it can simulate a BNPL-style experience based on the teenager's real budget.

Example:

Teen asks for an $80 purchase in advance.

Parent agrees to a family advance.

Repayment:

- Week 1: -$20
- Week 2: -$20
- Week 3: -$20
- Week 4: -$20

The app explains:

> This purchase uses part of your future money.

The AI agent can show:

> If you continue with this plan, your safe-to-spend amount will fall by $20 each week for the next four weeks.

If the teenager runs out of flexible money, the system should show the consequence rather than automatically punish them.

Example:

- Safe-to-spend = $0
- Savings goal delayed
- Optional purchases become harder
- Parent-child conversation is triggered

## Practice Zone

A safe place to experience realistic financial pressure.

Possible scenarios:

- BNPL
- Flash sales
- Countdown timers
- Subscription upsells
- Free trials
- Influencer purchases
- FOMO
- Unexpected expenses

Scenarios should adapt to:

- Teenager's available budget
- Age
- Independence level
- Parent settings

These are simulations only.

## AI Financial Coach

A persistent agent can support the teenager across the app.

The AI should:

- Explain
- Simulate
- Ask questions
- Help reflect
- Help build saving strategies
- Show future consequences

It should avoid simply saying:

> "This is a bad decision."

Instead:

> "This purchase would use 70% of your flexible money this week. Want to see how that affects your savings goal?"

---

# Shared Family Features

## Weekly Reports

Both parent and teenager can view a weekly summary.

Parents control how much household financial information is visible.

Teenagers control some personal spending visibility within agreed boundaries.

The goal is shared understanding, not surveillance.

## Ask Questions About the Report

Both sides can ask questions such as:

> Why did our food spending increase this week?

> What happens if I save another $10 each week?

> Why does transport take such a large part of the household budget?

> How long will it take me to reach my goal?

The AI agent uses the household context to answer.

## Family Financial Habits Score

Do not rank families by:

- Total wealth
- Total savings
- Income
- Absolute saving percentage

Instead, score positive financial behaviours.

Possible factors:

- Saving consistency
- Bills paid on time
- Goal progress
- Planned vs unplanned spending
- Impulse purchases reconsidered
- Responsible use of future money
- Family money conversations
- Improvement over time

This allows optional friendly comparison without rewarding wealth.

---

# Core Differentiators

## 1. Safe-to-Spend

Transforms:

> "How much money do I have?"

into:

> "How much money can I safely use after my responsibilities?"

## 2. Future Consequence Simulation

Transforms:

> "Can I buy this?"

into:

> "What will my financial situation look like after I buy this?"

## 3. Graduated Independence

Parents gradually transfer responsibility instead of giving full control immediately.

## 4. Conversation Over Control

The system helps parents know when and how to discuss financial decisions.

## 5. Real Behaviour + Simulated Risk

Real money and real spending can be combined with safe simulations of:

- Credit
- BNPL
- Loans
- Unexpected expenses
- Dark patterns

---

# Future Features

These are not required for the hackathon MVP.

## Real Bank Integration

Potential future integration through New Zealand open banking.

Possible use cases:

- Read balances
- Read transactions
- Automatically categorise spending
- Update safe-to-spend

## Real Transfers / Payments

Possible longer-term feature, but this would require significantly more:

- Regulation
- Banking partnerships
- Security
- Identity verification
- Consent management
- Payment infrastructure

For the MVP, bank integration can be simulated using realistic transaction data.

---

# Design Principles

## Conversation Over Control

The product should help families talk about money, not create a surveillance dashboard.

## Practice Over Punishment

Mistakes should become learning experiences.

## Privacy by Design

Only show the financial information necessary for learning.

## Graduated Independence

Success means teenagers gradually need less parental control.

## Build Judgement, Not Just Knowledge

The goal is not simply to teach financial definitions.

The goal is to help teenagers make better financial decisions independently.

## One Useful Insight at a Time

Avoid constant alerts and judgement.

Surface the most relevant learning opportunity.

---

# Product Positioning

**Expense apps tell families what happened.  
18 Before 18 helps them understand what it means and make better decisions next time.**

## One-Sentence Product Definition

> **18 Before 18 is a gamified family financial learning platform that combines real spending behaviour with simulated future consequences, helping teenagers build good financial habits through practice, reflection, and guided conversations with their parents.**

## Core Product Loop

**Track → Understand → Simulate → Discuss → Improve**

## Long-Term Goal

> **Help children develop good financial habits and independent financial judgement before they reach full financial independence.**
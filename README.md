# Bitespeed Backend Task: Identity Reconciliation

This project implements a backend service for identity reconciliation as per the Bitespeed backend task. It allows linking different contact information (email and phone number) to a single customer identity.

## Deployed Endpoint

The `/identify` endpoint is hosted on Render.com and can be accessed at:

**POST** `https://bitespeed-eelq.onrender.com/api/identify`
---

## Features

*   Identifies customers based on email and/or phone number.
*   Creates new primary contacts if no matching identity is found.
*   Links new information to existing identities by creating secondary contacts.
*   Merges distinct identities if a request links them, promoting the older contact to primary and demoting others to secondary.
*   Returns a consolidated contact view including all known emails, phone numbers, the primary contact ID, and all secondary contact IDs.

---

## Tech Stack

*   **Backend:** Node.js, Express.js
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Sequelize
*   **Hosting:** Render.com (using Docker)

---


**Request Body (JSON):**

```json
{
  "email": "string",      
  "phoneNumber": "string" 
}

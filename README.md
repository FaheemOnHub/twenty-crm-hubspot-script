# HubSpot to Twenty CRM Contact Migration Script
This Node.js script facilitates migrating contacts from HubSpot CRM to Twenty CRM. The user has the option to either check for duplicates in the Twenty CRM before migrating or directly migrate all contacts without checking.

## Features
- HubSpot Integration: Fetch contacts from HubSpot, including properties like email, name, and phone number.
- Twenty CRM Integration: Migrate contacts to Twenty CRM in batch mode.
- Duplicate Check: Option to check for duplicates based on first and last names before migrating.
- Skip Duplicate Check: Option to skip the duplicate check for faster migration, ideal for first-time users.
## Prerequisites
Ensure you have the following:

- Node.js installed.
- API keys for both HubSpot and Twenty CRM.
- dotenv package to manage environment variables.
## Installation
Clone the repository:

```bash
Copy code
git clone https://github.com/your-username/hubspot-to-twenty-migration.git
cd hubspot-to-twenty-migration
```
## Install the dependencies:

```bash
Copy code
npm install
Create a .env file at the root of your project:
```
```bash
Copy code
touch .env
```
Populate your .env file with the following:

```bash
Copy code
HUBSPOT_API_KEY=your_hubspot_api_key
TWENTY_API_KEY=your_twenty_api_key
```
## Usage
Start the script by running:

```bash
Copy code
node app.js
```
The script will prompt you:

If you want to check for duplicates before migrating.
If you want to start the migration.
The process will begin based on your responses.

## Example
```bash
Copy code
Do you want to check for duplicates before migrating? (yes/no): yes
Do you want to start the script (yes/no): yes
```
This will check each contact in Twenty CRM for duplicates based on their first and last names before migrating.
Functions
fetchHubSpotContacs(after): Fetches contacts from HubSpot, 100 contacts at a time, using paging tokens for large datasets.
mapDataToTwentyFormat: Maps HubSpot contact data to Twenty CRM's expected format.
sendToTwentyCRM(mappedData, checkDuplicates): Sends contacts to Twenty CRM, either checking for duplicates or bypassing the check.
checkContactInTwenty(firstName, lastName): Checks if a contact with the given first and last name exists in Twenty CRM.
Error Handling
The script includes basic error handling for API requests and logs any issues that arise during the migration process.

## License
This project is licensed under the MIT License.

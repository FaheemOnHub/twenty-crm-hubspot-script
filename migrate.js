import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
const hubspotApiKey = process.env.HUBSPOT_API_KEY;
const twentyApiKey = process.env.TWENTY_API_KEY;
const no_of_contacts = process.env.contact_length;
async function fetchHubSpotContacs(after = null) {
  try {
    let url =
      "https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,phone";
    if (after) {
      url += `&after=${after}`; //paging cursor token of the last successfully read resource e.g "after": "NTI1Cg%3D%3D"
    }
    const response = await axios.get(
      url,
      {
        headers: {
          Authorization: `Bearer ${hubspotApiKey}`,
          "Content-Type": "application/json",
        },
      },
      (err, data) => {
        console.log(err);
      }
    );
    const contacts = response.data.results;
    const nextPage = response.data.paging?.next?.after || null;
    // console.log(response.data.results);
    return { contacts, nextPage };
  } catch (error) {
    console.log(error);
  }
}
function mapDataToTwentyFormat(hubspotData) {
  return hubspotData.map((contact) => {
    return {
      name: {
        firstName: contact.properties.firstname || "No First Name",
        lastName: contact.properties.lastname || "No Last Name",
      },
      emails: {
        primaryEmail: contact.properties.email || "No Email",
        additionalEmails: [], // Add additional emails if available
      },
      linkedinLink: {
        primaryLinkLabel: "LinkedIn", // Replace with actual label if available
        primaryLinkUrl: "", // Replace with actual URL if available
        secondaryLinks: [], // Add secondary links if available
      },
      xLink: {
        primaryLinkLabel: "X Link", // Replace with actual label if available
        primaryLinkUrl: "", // Replace with actual URL if available
        secondaryLinks: [], // Add secondary links if available
      },
      jobTitle: "No Job Title", // Replace with actual job title if available
      phones: {
        primaryPhoneNumber: contact.properties.phone || "No Phone Number",
        primaryPhoneCountryCode: "US", // Replace with the correct country code if available
        additionalPhones: [], // Add additional phone numbers if available
      },
      city: "No City", // Replace with actual city if available
      avatarUrl: "", // Replace with actual avatar URL if available
      position: 0, // Set the position or any other necessary field
      createdBy: { source: "EMAIL" }, // or another source as appropriate
      companyId: null, // Replace with actual company ID if available
    };
  });
}
async function sendToTwentyCRM(mappedData) {
  for (const contact of mappedData) {
    const existingContact = await checkContactInTwenty(
      contact.name.firstName,
      contact.name.lastName
    );
    if (existingContact) {
      console.log(
        `Contact with email ${contact.name.firstName} already exists. Skipping.`
      );
      continue; // Skip inserting the duplicate contact
    }
    const options = {
      method: "POST",
      url: "https://api.twenty.com/rest/batch/people",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${twentyApiKey}`, // Ensure this is the correct Bearer token
      },
      data: contact, // Use the mapped data
    };

    try {
      const { data } = await axios.request(options);
      console.log("Contacts migrated successfully:", data);
    } catch (error) {
      console.error("Error migrating contacts:", error.message);
      // console.error(error);
    }
  }
}

async function syncAllContacts() {
  let after = null;
  let allContacts = [];
  do {
    const { contacts, nextPage } = await fetchHubSpotContacs(after);
    if (contacts) {
      allContacts = allContacts.concat(contacts);
      console.log(allContacts);
    }
    after = nextPage;

    await new Promise((resolve) => setTimeout(resolve, 5000));
  } while (after);
  return allContacts;
}
async function main() {
  const allHubSpotContacts = await syncAllContacts();
  const convertTotwentyForm = await mapDataToTwentyFormat(allHubSpotContacts);
  await sendToTwentyCRM(convertTotwentyForm);
}

async function checkContactInTwenty(firstName, lastName) {
  const options = {
    method: "GET",
    url: "https://api.twenty.com/rest/people",
    params: {
      filter: `name.firstName[eq]:${firstName}`,
      filter: `name.lastName[eq]:${lastName}`,
    },
    headers: {
      Accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OWM5ZjE2Ni1lZDM1LTRhMTgtYjMzYi0zZmJlNzA4ZDY1YzYiLCJpYXQiOjE3Mjk1Mjg0MzgsImV4cCI6NDg4MzEyODQzNywianRpIjoiOWJlOWVhZjMtM2VmOC00OWE2LWFjNDMtYmVjNTY4Y2JkNDBjIn0.SOlEYp1wL3lD1Hs3hXzQSQJUIyxaS0iPHtJe3UH89tc",
    },
  };
  try {
    const response = await axios.request(options);
    console.log(response.data.totalCount);
    if (response.data.totalCount > 0) {
      return response.data;
    }
    return response.data; // Return existing contact if found
  } catch (error) {
    return null; // Return null if not found
  }
}

main();
// checkContactInTwenty();
//   const options = {
//     method: "GET",
//     url: "https://api.twenty.com/rest/people",
//     headers: {
//       Accept: "application/json",
//       Authorization:
//         "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OWM5ZjE2Ni1lZDM1LTRhMTgtYjMzYi0zZmJlNzA4ZDY1YzYiLCJpYXQiOjE3Mjk1Mjg0MzgsImV4cCI6NDg4MzEyODQzNywianRpIjoiOWJlOWVhZjMtM2VmOC00OWE2LWFjNDMtYmVjNTY4Y2JkNDBjIn0.SOlEYp1wL3lD1Hs3hXzQSQJUIyxaS0iPHtJe3UH89tc",
//     },
//   };

//   try {
//     const { data } = await axios.request(options);
//     console.log(data.data.people);
//   } catch (error) {
//     console.error(error);
//   }
// }
// test();

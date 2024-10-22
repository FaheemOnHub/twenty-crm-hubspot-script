import axios from "axios";
import dotenv from "dotenv";
import readline from "readline";
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
        additionalEmails: [],
      },
      linkedinLink: {
        primaryLinkLabel: "LinkedIn",
        primaryLinkUrl: "",
        secondaryLinks: [],
      },
      xLink: {
        primaryLinkLabel: "X Link",
        primaryLinkUrl: "",
        secondaryLinks: [],
      },
      jobTitle: "No Job Title",
      phones: {
        primaryPhoneNumber: contact.properties.phone || "No Phone Number",
        primaryPhoneCountryCode: "US",
        additionalPhones: [],
      },
      city: "No City",
      avatarUrl: "",
      position: 0,
      createdBy: { source: "EMAIL" },
      companyId: null,
    };
  });
}
async function sendToTwentyCRM(mappedData, checkDuplicates) {
  const uniqueContacts = [];
  if (checkDuplicates) {
    for (const contact of mappedData) {
      const existingContact = await checkContactInTwenty(
        contact.name.firstName,
        contact.name.lastName
      );
      if (existingContact) {
        console.log(
          `Contact with name ${
            contact.name.firstName + contact.name.lastName
          } already exists. Skipping.`
        );
        continue;
      }
      uniqueContacts.push(contact);
    }
  } else {
    console.log("Skipping duplicate check, migrating all contacts.");
    uniqueContacts.push(...mappedData);
  }

  const options = {
    method: "POST",
    url: "https://api.twenty.com/rest/batch/people",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${twentyApiKey}`,
    },
    data: uniqueContacts,
  };

  try {
    const { data } = await axios.request(options);
    console.log("Contacts migrated successfully:", data);
  } catch (error) {
    console.error("Error migrating contacts:", error.message);
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
async function main(checkDuplicates) {
  const allHubSpotContacts = await syncAllContacts();
  const convertTotwentyForm = await mapDataToTwentyFormat(allHubSpotContacts);
  await sendToTwentyCRM(convertTotwentyForm, checkDuplicates);
}

async function checkContactInTwenty(firstName, lastName) {
  const options = {
    method: "GET",
    url: "https://api.twenty.com/rest/people",
    params: {
      filter: `name.firstName[eq]:${firstName},name.lastName[eq]:${lastName}`,
      // filter: `emails.primaryEmail[eq]:${email}`, :use email filter if your contacts has email
    },

    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${twentyApiKey}`,
    },
  };
  try {
    const response = await axios.request(options);

    if (response.data.totalCount > 0) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.question(
  "Do you want to check for duplicates before migrating? (yes/no): ",
  (answer) => {
    const checkDuplicates = answer.toLowerCase() === "yes";
    rl.question("Do you want to start the script (yes/no): ", (startAnswer) => {
      if (startAnswer.toLowerCase() === "yes") {
        main(checkDuplicates);
      } else {
        console.log("Script not started.");
      }
      rl.close();
    });
  }
);

const axios = require('axios');

let _token = null;
let _instanceUrl = null;
let _tokenExpiry = 0;

const SF_LOGIN_URL = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
const API_VERSION  = process.env.SF_API_VERSION || 'v59.0';

const fetchToken = async () => {
  const { data } = await axios.post(`${SF_LOGIN_URL}/services/oauth2/token`, null, {
    params: {
      grant_type:    'password',
      client_id:     process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
      username:      process.env.SF_USERNAME,
      password:      process.env.SF_PASSWORD + (process.env.SF_SECURITY_TOKEN || ''),
    },
  });
  _token       = data.access_token;
  _instanceUrl = data.instance_url;
  _tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min
};

const getAuth = async () => {
  if (!_token || Date.now() > _tokenExpiry) await fetchToken();
  return { token: _token, instanceUrl: _instanceUrl };
};

const sfRequest = async (method, path, data) => {
  const { token, instanceUrl } = await getAuth();
  const url = `${instanceUrl}/services/data/${API_VERSION}/${path}`;
  const res = await axios({ method, url, data,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.data;
};

const createAccount = (fields) =>
  sfRequest('post', 'sobjects/Account', fields);

const createContact = (fields) =>
  sfRequest('post', 'sobjects/Contact', fields);

const getAccountUrl = (id) =>
  `${_instanceUrl}/${id}`;

const createAccountAndContact = async ({ user, form }) => {
  const accountPayload = {
    Name:        form.company || `${user.name}'s Account`,
    Phone:       form.phone        || undefined,
    Website:     form.website      || undefined,
    Industry:    form.industry     || undefined,
    Description: `Created via Inventra CRM integration. User email: ${user.email}`,
  };

  const accountResult = await createAccount(accountPayload);
  if (!accountResult.success) throw new Error('Failed to create Salesforce Account');

  const contactPayload = {
    AccountId:  accountResult.id,
    FirstName:  form.firstName || user.name.split(' ')[0] || user.name,
    LastName:   form.lastName  || user.name.split(' ').slice(1).join(' ') || '-',
    Email:      user.email,
    Phone:      form.phone        || undefined,
    Title:      form.jobTitle     || undefined,
    Department: form.department   || undefined,
    LeadSource: 'Web',
    Description: `Inventra user since ${new Date(user.createdAt).toLocaleDateString()}`,
  };

  const contactResult = await createContact(contactPayload);
  if (!contactResult.success) throw new Error('Failed to create Salesforce Contact');

  return {
    accountId:   accountResult.id,
    contactId:   contactResult.id,
    accountUrl:  getAccountUrl(accountResult.id),
    contactUrl:  getAccountUrl(contactResult.id),
    instanceUrl: _instanceUrl,
  };
};

module.exports = { createAccountAndContact, getAuth };

import { config, getToken, apiUrl } from './config.js';

async function fetchData() {
  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `token ${getToken()}` },
    });
    const data = await response.json();
    return JSON.parse(data.files[config.gistFileName].content);
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

function populateCollections(loanId, customers) {
  const collectionSection = document.getElementById('collectionSection');
  collectionSection.innerHTML = '';
  let loanCollections = [];
  let customerName = 'Unknown';

  customers.forEach(customer => {
    customer.loans.forEach(loan => {
      if (loan.id === loanId) {
        loanCollections = loan.collections;
        customerName = customer.name;
      }
    });
  });

  document.getElementById('customerName').textContent = customerName;

  loanCollections.forEach((collection) => {
    const collectionRow = document.createElement('tr');
    const collectionDate = new Date(collection.date);
    collectionRow.innerHTML = `
      <td data-label="Date">${collectionDate.toLocaleDateString()}</td>
      <td data-label="Time">${collectionDate.toLocaleTimeString()}</td> 
      <td data-label="Amount">${collection.amount.toFixed(2)}</td>
    `;
    collectionSection.appendChild(collectionRow);
  });
}

function getLoanIdByToken(token, customers) {
  for (const customer of customers) {
    for (const loan of customer.loans) {
      if (loan.token === token) {
        return loan.id;
      }
    }
  }
  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const data = await fetchData();
  if (data) {
    const loanId = getLoanIdByToken(token, data.customers);
    if (loanId) {
      document.getElementById('loanId').textContent = loanId;
      populateCollections(loanId, data.customers);
    } else {
      alert('You do not have access to view this loan.');
      window.location.href = 'index.html';
    }
  } else {
    alert('Error fetching data. Please try again.');
  }
});

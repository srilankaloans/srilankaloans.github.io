import { config, getToken, apiUrl, setupTableSorting, setupPagination, calculateCompoundInterest } from './config.js';

async function fetchData() {
  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `token ${getToken()}` },
    });
    const data = await response.json();
    return JSON.parse(data.files[config.gistFileName]?.content || '{}');
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

function populateCollections(loanId, customers) {
  const collectionSectionPublic = document.getElementById('collectionSectionPublic');
  collectionSectionPublic.innerHTML = '';
  let loanCollections = [];
  let customerName = 'Unknown';
  let loanAmount = 0;
  let interestRate = 0;
  let duration = 0;

  customers?.forEach(customer => {
    customer.loans?.forEach(loan => {
      if (loan.id === loanId) {
        loanCollections = loan.collections || [];
        customerName = customer.name;
        loanAmount = loan.loanAmount;
        interestRate = loan.interestRate;
        duration = loan.duration / 30; // Convert duration to months
      }
    });
  });

  document.getElementById('customerName').textContent = customerName;

  const totalAmountDue = loanAmount + calculateCompoundInterest(loanAmount, interestRate, duration);
  let collectedAmount = 0;

  loanCollections.forEach((collection) => {
    const collectionRow = document.createElement('tr');
    collectedAmount += collection.amount;
    const remainingAmountDue = totalAmountDue - collectedAmount;
    const collectionDate = new Date(collection.date);
    collectionRow.innerHTML = `
      <td data-label="Date">${collectionDate.toLocaleDateString()}</td>
      <td data-label="Time">${collectionDate.toLocaleTimeString()}</td>
      <td data-label="Amount Due">${remainingAmountDue.toFixed(2)}</td>
      <td data-label="Amount">${collection.amount.toFixed(2)}</td>
    `;
    collectionSectionPublic.appendChild(collectionRow);
  });

  setupTableSorting('collectionTable');
  setupPagination('collectionTable', 10);
}

function getLoanIdByToken(token, customers) {
  for (const customer of customers || []) {
    for (const loan of customer.loans || []) {
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
  console.log('Token:', token); // Debugging line
  const data = await fetchData();
  if (data) {
    console.log('Fetched Data:', data); // Debugging line
    const loanId = getLoanIdByToken(token, data.customers);
    console.log('Loan ID:', loanId); // Debugging line
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

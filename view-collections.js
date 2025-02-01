import { config, getToken } from './config.js';

const isProduction = window.location.hostname !== '127.0.0.1';
const { gistId } = config;
const apiUrl = `https://api.github.com/gists/${gistId}`;
const localDataUrl = 'data.json';

async function fetchData() {
  try {
    const response = await fetch(isProduction ? apiUrl : localDataUrl, {
      headers: isProduction ? { Authorization: `token ${getToken()}` } : {},
    });
    const data = await response.json();
    return isProduction ? JSON.parse(data.files['data.json'].content) : data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

function populateCollections(loanId, loans, collections, customers) {
  const collectionSection = document.getElementById('collectionSection');
  collectionSection.innerHTML = '';
  const loanCollections = collections.filter((collection) => collection.loanId === loanId);
  if (loanCollections.length > 0) {
    const loan = loans.find(l => l.id === loanId);
    const customer = customers.find((c) => c.id === loan.customerId);
    document.getElementById('customerName').textContent = customer ? customer.name : 'Unknown';
  }
  loanCollections.forEach((collection) => {
    const collectionRow = document.createElement('tr');
    const collectionDate = new Date(collection.date);
    collectionRow.innerHTML = `
      <td>${collectionDate.toLocaleDateString()}</td>
      <td>${collectionDate.toLocaleTimeString()}</td> <!-- Add Time column data -->
      <td>${collection.amount.toFixed(2)}</td>
      <!-- Remove QR code column data -->
    `;
    collectionSection.appendChild(collectionRow);
  });
}

function getLoanIdByToken(token, loans) {
  const loan = loans.find(loan => loan.token === token);
  return loan ? loan.id : null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const data = await fetchData();
  if (data) {
    const loanId = getLoanIdByToken(token, data.loans);
    if (loanId) {
      document.getElementById('loanId').textContent = loanId;
      populateCollections(loanId, data.loans, data.collections, data.customers);
    } else {
      alert('You do not have access to view this loan.');
      window.location.href = 'index.html';
    }
  }
});

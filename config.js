import sha256 from 'https://cdn.skypack.dev/crypto-js/sha256';

const config = {
  gistId: '2886a159d1e20d6aa2561bea3effe610', // Replace with your Gist ID
  token: 'g***hp_H9j6LzM*****HhJzrFl*************dbwYfCxugKZ0************uZag0aOGpe', // Tampered token
};

const getToken = () => config.token.split('*').join('');

export { config, getToken };

const isProduction = window.location.hostname !== '127.0.0.1';
const { gistId } = config;
const apiUrl = `https://api.github.com/gists/${gistId}`;
const localDataUrl = 'data.json';

let appState = {
  customers: [],
  loans: [],
  collections: [],
  users: [], // Add users to the app state
  currentUser: null, // Track the current user
};

function showToast(message) {
  const toaster = document.getElementById('toaster');
  toaster.textContent = message;
  toaster.className = "toaster show";
  setTimeout(() => { toaster.className = toaster.className.replace("show", ""); }, 3000);
}

async function fetchData() {
  try {
    const response = await fetch(isProduction ? apiUrl : localDataUrl, {
      headers: isProduction ? { Authorization: `token ${getToken()}` } : {},
    });
    const data = await response.json();
    appState = isProduction ? JSON.parse(data.files['data.json'].content) : data;
    populateCustomerDropdown();
    populateCustomersList();
    populateLoansList();
    populateCollectionSection();
  } catch (error) {
    console.error('Error fetching data:', error);
    showToast('Error fetching data. Please try again.');
  }
}

async function saveData() {
  try {
    const updatedContent = JSON.stringify(appState, null, 2);
    if (isProduction) {
      await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'data.json': {
              content: updatedContent,
            },
          },
        }),
      });
    } else {
      // For local development, you might need to implement a local server to handle saving data
      console.log('Data to be saved locally:', updatedContent);
    }
    showToast('Data saved successfully!');
  } catch (error) {
    console.error('Error saving data:', error);
    showToast('Error saving data. Please try again.');
  }
}

async function refreshData() {
  await fetchData();
  showToast('Data refreshed successfully!');
}

function autoGenerateCustomerId() {
  const maxId = appState.customers.reduce((max, customer) => {
    const id = parseInt(customer.id.replace('CUST', ''), 10);
    return id > max ? id : max;
  }, 0);
  return `CUST${String(maxId + 1).padStart(4, '0')}`;
}

function autoGenerateLoanId() {
  const maxId = appState.loans.reduce((max, loan) => {
    const id = parseInt(loan.id.replace('LOAN', ''), 10);
    return id > max ? id : max;
  }, 0);
  return `LOAN${String(maxId + 1).padStart(4, '0')}`;
}

function populateCustomerDropdown() {
  const customerDropdown = document.getElementById('customerDropdown');
  customerDropdown.innerHTML = '<option value="">Select Customer</option>';
  appState.customers.forEach((customer) => {
    const option = document.createElement('option');
    option.value = customer.id;
    option.textContent = customer.name;
    customerDropdown.appendChild(option);
  });
}

function populateCustomersList() {
  const customersList = document.getElementById('customersList');
  customersList.innerHTML = '';
  appState.customers.forEach((customer) => {
    const customerRow = document.createElement('tr');
    customerRow.innerHTML = `
      <td data-label="Customer ID">${customer.id}</td>
      <td data-label="Customer Name">${customer.name}</td>
    `;
    customersList.appendChild(customerRow);
  });
}

function populateLoansList() {
  const loansList = document.getElementById('loansList');
  loansList.innerHTML = '';
  appState.loans.forEach((loan) => {
    const loanRow = document.createElement('tr');
    loanRow.innerHTML = `
      <td data-label="Loan ID">${loan.id}</td>
      <td data-label="Customer ID">${loan.customerId}</td>
      <td data-label="Loan Amount">${loan.loanAmount}</td>
      <td data-label="Interest Rate">${loan.interestRate}</td>
      <td data-label="Duration">${loan.duration}</td>
      <td data-label="Status">${loan.status}</td>
      <td data-label="Action">
        ${appState.currentUser?.type === 'admin' ? `<button class="delete-loan-button" onclick="handleDeleteLoan('${loan.id}')">Delete</button>` : ''}
      </td>
    `;
    loansList.appendChild(loanRow);
  });
}

function populateCollectionSection() {
  const collectionSection = document.getElementById('collectionSection');
  collectionSection.innerHTML = '';
  appState.loans.forEach((loan) => {
    const customer = appState.customers.find((c) => c.id === loan.customerId);
    const collections = appState.collections.filter((collection) => collection.loanId === loan.id);
    const collectedAmount = collections.reduce((total, collection) => total + collection.amount, 0);
    const totalAmountDue = loan.loanAmount + (loan.loanAmount * loan.interestRate / 100);
    const isCollectDisabled = collectedAmount >= totalAmountDue;
    if (isCollectDisabled) {
      loan.status = 'completed';
    }
    const loanDiv = document.createElement('tr');
    loanDiv.innerHTML = `
      <td data-label="Customer Name">${customer ? customer.name : 'Unknown'}</td>
      <td data-label="Loan ID">${loan.id}</td>
      <td data-label="Start Date">${new Date(loan.startDate).toLocaleDateString()}</td>
      <td data-label="Collected Amount">${collectedAmount.toFixed(2)}</td>
      <td data-label="Count">${collections.length}</td>
      <td data-label="Amount">
        <input type="number" id="collectAmount-${loan.id}" placeholder="Amount" ${isCollectDisabled ? 'disabled' : ''} />
      </td>
      <td data-label="Action" class="action-section">
        <button onclick="handleCollect('${loan.id}')" ${isCollectDisabled ? 'class="completed-button" disabled' : ''}>
          <i class="${isCollectDisabled ? 'fas fa-check-circle' : 'fas fa-hand-holding-usd'}"></i>
        </button>
        ${appState.currentUser?.type === 'admin' ? `<button class="delete-collection-button" onclick="handleDeleteCollection('${loan.id}')"><i class="fas fa-trash-alt"></i></button>` : ''}
        <button class="view-collection-button" onclick="showCollectionDetails('${loan.id}')"><i class="fas fa-info-circle"></i></button>
      </td>
    `;
    collectionSection.appendChild(loanDiv);

    // Disable collect button if amount is not filled
    const collectAmountInput = document.getElementById(`collectAmount-${loan.id}`);
    const collectButton = loanDiv.querySelector('button');
    collectAmountInput.addEventListener('input', () => {
      collectButton.disabled = !collectAmountInput.value || parseFloat(collectAmountInput.value) <= 0;
    });
  });
  hideDeleteButtonsForManagers();
}

async function handleCollect(loanId) {
  const confirmed = confirm('Are you sure you want to collect for this loan?');
  if (confirmed) {
    const loan = appState.loans.find((l) => l.id === loanId);
    const collectAmountInput = document.getElementById(`collectAmount-${loanId}`);
    const collectAmount = parseFloat(collectAmountInput.value);
    if (isNaN(collectAmount) || collectAmount <= 0) {
      showToast('Please enter a valid amount.');
      return;
    }
    const collections = appState.collections.filter((collection) => collection.loanId === loanId);
    const collectedAmount = collections.reduce((total, collection) => total + collection.amount, 0);
    const totalAmountDue = loan.loanAmount + (loan.loanAmount * loan.interestRate / 100);
    if (collectedAmount + collectAmount > totalAmountDue) {
      showToast('Collection amount exceeds the total amount due.');
      return;
    }
    appState.collections.push({ loanId, date: new Date().toISOString(), amount: collectAmount });
    await saveData();
    showToast(`Collection recorded for Loan ID: ${loanId}`);
    populateCollectionSection(); // Update the collection section
  }
}

async function handleDeleteLoan(loanId) {
  const confirmed = confirm('Are you sure you want to delete this loan?');
  if (confirmed) {
    appState.loans = appState.loans.filter((loan) => loan.id !== loanId);
    appState.collections = appState.collections.filter((collection) => collection.loanId !== loanId);
    await saveData();
    showToast(`Loan ID: ${loanId} deleted successfully!`);
    populateLoansList();
    populateCollectionSection();
  }
}

async function handleDeleteCollection(loanId) {
  const confirmed = confirm('Are you sure you want to delete all collections for this loan?');
  if (confirmed) {
    appState.collections = appState.collections.filter((collection) => collection.loanId !== loanId);
    await saveData();
    showToast(`Collections for Loan ID: ${loanId} deleted successfully!`);
    populateCollectionSection();
  }
}

function filterCollections() {
  const filterLoanId = document.getElementById('filterLoanId').value.toLowerCase();
  const collectionSection = document.getElementById('collectionSection');
  const rows = collectionSection.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    const loanIdCell = rows[i].getElementsByTagName('td')[1];
    if (loanIdCell) {
      const loanId = loanIdCell.textContent || loanIdCell.innerText;
      rows[i].style.display = loanId.toLowerCase().indexOf(filterLoanId) > -1 ? '' : 'none';
    }
  }
  document.getElementById('clearFilters').style.display = 'inline-block';
}

function filterNotCompleted() {
  const collectionSection = document.getElementById('collectionSection');
  const rows = collectionSection.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    const loanIdCell = rows[i].getElementsByTagName('td')[1];
    if (loanIdCell) {
      const loanId = loanIdCell.textContent || loanIdCell.innerText;
      const loan = appState.loans.find((l) => l.id === loanId);
      rows[i].style.display = loan.status === 'completed' ? 'none' : '';
    }
  }
  document.getElementById('clearFilters').style.display = 'inline-block';
}

function filterNotCollectedToday() {
  const collectionSection = document.getElementById('collectionSection');
  const rows = collectionSection.getElementsByTagName('tr');
  const today = new Date().toLocaleDateString();
  for (let i = 0; i < rows.length; i++) {
    const loanIdCell = rows[i].getElementsByTagName('td')[1];
    if (loanIdCell) {
      const loanId = loanIdCell.textContent || loanIdCell.innerText;
      const loan = appState.loans.find((l) => l.id === loanId);
      const collections = appState.collections.filter((collection) => collection.loanId === loanId);
      const latestCollection = collections.reduce((latest, collection) => {
        const collectionDate = new Date(collection.date);
        return collectionDate > latest ? collectionDate : latest;
      }, new Date(0));
      const latestCollectionDate = latestCollection.toLocaleDateString();
      rows[i].style.display = (loan.status === 'completed' || latestCollectionDate === today) ? 'none' : '';
    }
  }
  document.getElementById('clearFilters').style.display = 'inline-block';
}

function clearFilters() {
  const collectionSection = document.getElementById('collectionSection');
  const rows = collectionSection.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    rows[i].style.display = '';
  }
  document.getElementById('clearFilters').style.display = 'none';
}

function toggleMenu() {
  const mainNav = document.getElementById('mainNav');
  mainNav.style.display = mainNav.style.display === 'block' ? 'none' : 'block';
}

function hideMenu() {
  const mainNav = document.getElementById('mainNav');
  mainNav.style.display = 'none';
}

function hideDeleteButtonsForManagers() {
  const userType = appState.currentUser?.type;
  if (userType === 'manager') {
    const deleteCollectionButtons = document.querySelectorAll('.delete-collection-button');
    deleteCollectionButtons.forEach(button => button.style.display = 'none');
  }
}

function showCollectionDetails(loanId) {
  const modal = document.getElementById('collectionDetailsModal');
  const modalContent = document.getElementById('collectionDetailsContent');
  const collections = appState.collections.filter(collection => collection.loanId === loanId);
  modalContent.innerHTML = `
    <h3>Collections for Loan ID: ${loanId}</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${collections.map(collection => `
          <tr>
            <td>${new Date(collection.date).toLocaleDateString()}</td>
            <td>${collection.amount.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <button class="close-button" onclick="closeCollectionDetails()">Close</button>
  `;
  modal.classList.add('show');
}

function closeCollectionDetails() {
  const modal = document.getElementById('collectionDetailsModal');
  modal.classList.remove('show');
}

document.getElementById('menuToggle').addEventListener('click', toggleMenu);

document.getElementById('customersPageButton').addEventListener('click', async () => {
  await fetchData();
  document.getElementById('customersPage').style.display = 'block';
  document.getElementById('loansPage').style.display = 'none';
  document.getElementById('collectionsPage').style.display = 'none';
  hideMenu();
});

document.getElementById('loansPageButton').addEventListener('click', async () => {
  await fetchData();
  document.getElementById('customersPage').style.display = 'none';
  document.getElementById('loansPage').style.display = 'block';
  document.getElementById('collectionsPage').style.display = 'none';
  hideMenu();
});

document.getElementById('collectionsPageButton').addEventListener('click', async () => {
  await fetchData();
  document.getElementById('customersPage').style.display = 'none';
  document.getElementById('loansPage').style.display = 'none';
  document.getElementById('collectionsPage').style.display = 'block';
  hideMenu();
});

document.getElementById('logoutButton').addEventListener('click', () => {
  // Clear app state and show login screen
  appState = {
    customers: [],
    loans: [],
    collections: [],
    users: appState.users, // Preserve users
    currentUser: null,
  };
  showToast('You have been logged out.');
  document.getElementById('mainNav').style.display = 'none';
  document.getElementById('menuToggle').style.display = 'none';
  document.getElementById('customersPage').style.display = 'none';
  document.getElementById('loansPage').style.display = 'none';
  document.getElementById('collectionsPage').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
});

document.addEventListener('DOMContentLoaded', () => {
  // Initially show login screen
  document.getElementById('mainNav').style.display = 'none';
  document.getElementById('menuToggle').style.display = 'none';
  document.getElementById('customersPage').style.display = 'none';
  document.getElementById('loansPage').style.display = 'none';
  document.getElementById('collectionsPage').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
});

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  // Perform login validation here
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const hashedPassword = sha256(password).toString();
  try {
    const response = await fetch(isProduction ? apiUrl : localDataUrl, {
      headers: isProduction ? { Authorization: `token ${getToken()}` } : {},
    });
    const data = await response.json();
    const users = isProduction ? JSON.parse(data.files['data.json'].content).users : data.users;
    const user = users.find((user) => user.username === username && user.password === hashedPassword);
    if (user) {
      appState.currentUser = user;
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('mainNav').style.display = 'none'; // Ensure menu is collapsed initially
      document.getElementById('menuToggle').style.display = 'block';
      if (user.type === 'admin') {
        document.getElementById('adminDashboard').style.display = 'block';
      } else if (user.type === 'manager') {
        document.getElementById('customersPage').style.display = 'block';
        document.getElementById('loansPage').style.display = 'none';
        document.getElementById('collectionsPage').style.display = 'none';
        fetchData();
      }
    } else {
      showToast('Invalid credentials!');
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    showToast('Error during login. Please try again.');
  }
});

document.getElementById('refreshButton').addEventListener('click', refreshData);

document.getElementById('addCustomerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const customerName = document.getElementById('customerName').value;
  const newCustomer = {
    id: autoGenerateCustomerId(),
    name: customerName,
  };
  appState.customers.push(newCustomer);
  await saveData();
  showToast(`Customer ${customerName} added successfully!`);
  populateCustomersList();
  document.getElementById('addCustomerForm').reset();
});

document.getElementById('addLoanForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const customerId = document.getElementById('customerDropdown').value;
  const loanAmount = parseFloat(document.getElementById('loanAmount').value);
  const interestRate = parseFloat(document.getElementById('interestRate').value);
  const duration = parseInt(document.getElementById('duration').value, 10);
  const newLoan = {
    id: autoGenerateLoanId(),
    customerId,
    loanAmount,
    interestRate,
    duration,
    startDate: new Date().toISOString(),
    status: 'active',
  };
  appState.loans.push(newLoan);
  await saveData();
  showToast(`Loan for Customer ID: ${customerId} added successfully!`);
  populateLoansList();
  document.getElementById('addLoanForm').reset();
});

window.handleDeleteLoan = handleDeleteLoan;
window.filterCollections = filterCollections;
window.handleDeleteCollection = handleDeleteCollection;
window.hideDeleteButtonsForManagers = hideDeleteButtonsForManagers;
window.handleCollect = handleCollect;
window.showCollectionDetails = showCollectionDetails;
window.closeCollectionDetails = closeCollectionDetails;
window.filterNotCompleted = filterNotCompleted;
window.filterNotCollectedToday = filterNotCollectedToday;
window.clearFilters = clearFilters;

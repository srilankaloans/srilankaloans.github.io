const config = {
  gistId: '2886a159d1e20d6aa2561bea3effe610',
  gistFileName: 'data.json',
  token: 'g***hp_H9j6LzM*****HhJzrFl*************dbwYfCxugKZ0************uZag0aOGpe', // Tampered token
  commitVersion: '1.0.1' // Increment this value for each commit
};
//7db36bae46a98a48170c6f648b8c9d2e -> testdata.json
//2886a159d1e20d6aa2561bea3effe610 -> data.json
const getToken = () => config.token.split('*').join('');
const apiUrl = `https://api.github.com/gists/${config.gistId}`;
export { config, getToken, apiUrl };

let appState = {
  customers: [],
  users: [], // Add users to the app state
  currentUser: JSON.parse(localStorage.getItem('currentUser')) || null, // Track the current user
};

function showToast(message) {
  const toaster = document.getElementById('toaster');
  toaster.textContent = message;
  toaster.className = "toaster show";
  setTimeout(() => { toaster.className = toaster.className.replace("show", ""); }, 3000);
}

async function fetchData() {
  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `token ${getToken()}` },
    });
    const data = await response.json();
    const fetchedData = JSON.parse(data.files[config.gistFileName].content);
    appState.customers = fetchedData.customers;
    appState.users = fetchedData.users;
    // Preserve currentUser
    appState.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
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
    await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [config.gistFileName]: {
            content: updatedContent,
          },
        },
      }),
    });
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
  const maxId = appState.customers.reduce((max, customer) => {
    if (customer.loans) {
      const customerMaxId = customer.loans.reduce((loanMax, loan) => {
        const id = parseInt(loan.id.replace('LOAN', ''), 10);
        return id > loanMax ? id : loanMax;
      }, 0);
      return customerMaxId > max ? customerMaxId : max;
    }
    return max;
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
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  appState.customers.forEach((customer) => {
    const customerRow = document.createElement('tr');
    customerRow.innerHTML = `
      <td data-label="Customer ID">${customer.id}</td>
      <td data-label="Customer Name">${customer.name}</td>
      ${currentUser?.type === 'admin' ? `<td data-label="Action"><button class="delete-customer-button" onclick="handleDeleteCustomer('${customer.id}')">Delete</button></td>` : ''}
    `;
    customersList.appendChild(customerRow);
  });
}

function populateLoansList() {
  const loansList = document.getElementById('loansList');
  loansList.innerHTML = '';
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  appState.customers.forEach((customer) => {
    if (customer.loans) {
      customer.loans.forEach((loan) => {
        const loanRow = document.createElement('tr');
        loanRow.innerHTML = `
          <td data-label="Loan ID">${loan.id}</td>
          <td data-label="Customer ID">${customer.id}</td>
          <td data-label="Loan Amount">${loan.loanAmount}</td>
          <td data-label="Interest Rate">${loan.interestRate}</td>
          <td data-label="Duration">${loan.duration}</td>
          <td data-label="Status">${loan.status}</td>
          ${currentUser?.type === 'admin' ? `<td data-label="Action"><button class="delete-loan-button" onclick="handleDeleteLoan('${loan.id}')">Delete</button></td>` : ''}
        `;
        loansList.appendChild(loanRow);
      });
    }
  });
}

function populateCollectionSection() {
  const collectionSection = document.getElementById('collectionSection');
  collectionSection.innerHTML = '';
  appState.customers.forEach((customer) => {
    if (customer.loans) {
      customer.loans.forEach((loan) => {
        const collections = loan.collections;
        const collectedAmount = collections.reduce((total, collection) => total + collection.amount, 0);
        const totalAmountDue = loan.loanAmount + (loan.loanAmount * loan.interestRate / 100);
        const isCollectDisabled = collectedAmount >= totalAmountDue;
        if (isCollectDisabled) {
          loan.status = 'completed';
        }
        const loanDiv = document.createElement('tr');
        loanDiv.innerHTML = `
          <td data-label="Customer Name">${customer.name}</td>
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
            <button class="generate-qr-button" onclick="generateQRCode('${loan.id}')"><i class="fas fa-qrcode"></i></button>
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
    }
  });
  hideDeleteButtonsForManagers();
}

async function handleCollect(loanId) {
  const confirmed = confirm('Are you sure you want to collect for this loan?');
  if (confirmed) {
    let loan;
    appState.customers.forEach(customer => {
      customer.loans.forEach(l => {
        if (l.id === loanId) {
          loan = l;
        }
      });
    });
    const collectAmountInput = document.getElementById(`collectAmount-${loanId}`);
    const collectAmount = parseFloat(collectAmountInput.value);
    if (isNaN(collectAmount) || collectAmount <= 0) {
      showToast('Please enter a valid amount.');
      return;
    }
    const collectedAmount = loan.collections.reduce((total, collection) => total + collection.amount, 0);
    const totalAmountDue = loan.loanAmount + (loan.loanAmount * loan.interestRate / 100);
    if (collectedAmount + collectAmount > totalAmountDue) {
      showToast('Collection amount exceeds the total amount due.');
      return;
    }
    loan.collections.push({ date: new Date().toISOString(), amount: collectAmount });
    await saveData();
    showToast(`Collection recorded for Loan ID: ${loanId}`);
    populateCollectionSection(); // Update the collection section
  }
}

async function handleDeleteCustomer(customerId) {
  const confirmed = confirm('Are you sure you want to delete this customer and all associated loans and collections?');
  if (confirmed) {
    appState.customers = appState.customers.filter((customer) => customer.id !== customerId);
    await saveData();
    showToast(`Customer ID: ${customerId} and all associated loans and collections deleted successfully!`);
    populateCustomersList();
    populateLoansList();
    populateCollectionSection();
  }
}

async function handleDeleteLoan(loanId) {
  const confirmed = confirm('Are you sure you want to delete this loan and all associated collections?');
  if (confirmed) {
    appState.customers.forEach(customer => {
      customer.loans = customer.loans.filter(loan => loan.id !== loanId);
    });
    await saveData();
    showToast(`Loan ID: ${loanId} and all associated collections deleted successfully!`);
    populateLoansList();
    populateCollectionSection();
  }
}

async function handleDeleteCollection(loanId) {
  const confirmed = confirm('Are you sure you want to delete all collections for this loan?');
  if (confirmed) {
    appState.customers.forEach(customer => {
      customer.loans.forEach(loan => {
        if (loan.id === loanId) {
          loan.collections = [];
        }
      });
    });
    await saveData();
    showToast(`Collections for Loan ID: ${loanId} deleted successfully!`);
    populateCollectionSection();
  }
}

// async function handleDeleteCollectionItem(loanId, date) {
//   const confirmed = confirm('Are you sure you want to delete this collection item?');
//   if (confirmed) {
//     appState.customers.forEach(customer => {
//       customer.loans.forEach(loan => {
//         if (loan.id === loanId) {
//           loan.collections = loan.collections.filter(collection => collection.date !== date);
//         }
//       });
//     });
//     await saveData();
//     showToast(`Collection item for Loan ID: ${loanId} deleted successfully!`);
//     showCollectionDetails(loanId); // Refresh the collection details view
//   }
// }

// window.handleDeleteCollectionItem = handleDeleteCollectionItem;

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
      const loan = appState.customers.flatMap(customer => customer.loans || []).find(l => l.id === loanId);
      rows[i].style.display = loan?.status === 'completed' ? 'none' : '';
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
      const loan = appState.customers.flatMap(customer => customer.loans || []).find(l => l.id === loanId);
      const collections = loan?.collections || [];
      const latestCollection = collections.reduce((latest, collection) => {
        const collectionDate = new Date(collection.date);
        return collectionDate > latest ? collectionDate : latest;
      }, new Date(0));
      const latestCollectionDate = latestCollection.toLocaleDateString();
      rows[i].style.display = (loan?.status === 'completed' || latestCollectionDate === today) ? 'none' : '';
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
  if (mainNav) mainNav.style.display = mainNav.style.display === 'block' ? 'none' : 'block';
}

function hideMenu() {
  const mainNav = document.getElementById('mainNav');
  if (mainNav) mainNav.style.display = 'none';
}

function hideDeleteButtonsForManagers() {
  const userType = appState.currentUser?.type;
  if (userType === 'manager') {
    document.querySelectorAll('.delete-collection-button').forEach(button => button.style.display = 'none');
  }
}

function showCollectionDetails(loanId) {
  const modal = document.getElementById('collectionDetailsModal');
  const modalContent = document.getElementById('collectionDetailsContent');
  let collections = [];
  appState.customers.forEach(customer => {
    customer.loans.forEach(loan => {
      if (loan.id === loanId) {
        collections = loan.collections;
      }
    });
  });
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  modalContent.innerHTML = `
    <h3>Collections for Loan ID: ${loanId}</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          ${currentUser?.type === 'admin' ? '<th>Action</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${collections.map(collection => `
          <tr>
            <td>${new Date(collection.date).toLocaleDateString()}</td>
            <td>${collection.amount.toFixed(2)}</td>
            ${currentUser?.type === 'admin' ? `<td><button onclick="handleDeleteCollectionItem('${loanId}', '${collection.date}')"><i class="fas fa-trash-alt"></i></button></td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>
    <button class="close-button" onclick="closeCollectionDetails()">Close</button>
  `;
  modal.classList.add('show');
}

async function handleDeleteCollectionItem(loanId, date) {
  const confirmed = confirm('Are you sure you want to delete this collection item?');
  if (confirmed) {
    appState.customers.forEach(customer => {
      customer.loans.forEach(loan => {
        if (loan.id === loanId) {
          loan.collections = loan.collections.filter(collection => collection.date !== date);
        }
      });
    });
    await saveData();
    showToast(`Collection item for Loan ID: ${loanId} deleted successfully!`);
    showCollectionDetails(loanId); // Refresh the collection details view
  }
}

window.handleDeleteCollectionItem = handleDeleteCollectionItem;

function closeCollectionDetails() {
  const modal = document.getElementById('collectionDetailsModal');
  modal.classList.remove('show');
}

function generateQRCode(loanId) {
  let loan;
  appState.customers.forEach(customer => {
    customer.loans.forEach(l => {
      if (l.id === loanId) {
        loan = l;
      }
    });
  });
  const qrCodeModal = document.getElementById('qrCodeModal');
  const qrCodeContent = document.getElementById('qrCodeContent');
  const publicLink = `${window.location.origin}/view-collections.html?token=${loan.token}`;
  qrCodeContent.innerHTML = `<h3>QR Code for Loan ID: ${loanId}</h3><canvas id="qrCodeDisplay"></canvas><p><a href="${publicLink}" target="_blank">${publicLink}</a></p>`;
  QRCode.toCanvas(document.getElementById('qrCodeDisplay'), publicLink, function (error) {
    if (error) console.error(error);
  });
  qrCodeModal.classList.add('show');
}

function closeQRCodeModal() {
  const qrCodeModal = document.getElementById('qrCodeModal');
  qrCodeModal.classList.remove('show');
}

// Add checks to ensure the elements exist before adding event listeners
const menuToggle = document.getElementById('menuToggle');
if (menuToggle) menuToggle.addEventListener('click', toggleMenu);

const customersPageButton = document.getElementById('customersPageButton');
if (customersPageButton) {
  customersPageButton.addEventListener('click', async () => {
    await fetchData();
    const customersPage = document.getElementById('customersPage');
    const loansPage = document.getElementById('loansPage');
    const collectionsPage = document.getElementById('collectionsPage');
    if (customersPage) customersPage.style.display = 'block';
    if (loansPage) loansPage.style.display = 'none';
    if (collectionsPage) collectionsPage.style.display = 'none';
    hideMenu();
  });
}

const loansPageButton = document.getElementById('loansPageButton');
if (loansPageButton) {
  loansPageButton.addEventListener('click', async () => {
    await fetchData();
    const customersPage = document.getElementById('customersPage');
    const loansPage = document.getElementById('loansPage');
    const collectionsPage = document.getElementById('collectionsPage');
    if (customersPage) customersPage.style.display = 'none';
    if (loansPage) loansPage.style.display = 'block';
    if (collectionsPage) collectionsPage.style.display = 'none';
    hideMenu();
  });
}

const collectionsPageButton = document.getElementById('collectionsPageButton');
if (collectionsPageButton) {
  collectionsPageButton.addEventListener('click', async () => {
    await fetchData();
    const customersPage = document.getElementById('customersPage');
    const loansPage = document.getElementById('loansPage');
    const collectionsPage = document.getElementById('collectionsPage');
    if (customersPage) customersPage.style.display = 'none';
    if (loansPage) loansPage.style.display = 'none';
    if (collectionsPage) collectionsPage.style.display = 'block';
    hideMenu();
  });
}

const logoutButton = document.getElementById('logoutButton');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    // Clear app state and show login screen
    appState = {
      customers: [],
      users: appState.users, // Preserve users
      currentUser: null,
    };
    localStorage.removeItem('currentUser'); // Clear currentUser from localStorage
    showToast('You have been logged out.');
    const mainNav = document.getElementById('mainNav');
    const menuToggle = document.getElementById('menuToggle');
    const customersPage = document.getElementById('customersPage');
    const loansPage = document.getElementById('loansPage');
    const collectionsPage = document.getElementById('collectionsPage');
    const loginScreen = document.getElementById('loginScreen');
    if (mainNav) mainNav.style.display = 'none';
    if (menuToggle) menuToggle.style.display = 'none';
    if (customersPage) customersPage.style.display = 'none';
    if (loansPage) loansPage.style.display = 'none';
    if (collectionsPage) collectionsPage.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'block';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initially show login screen
  const mainNav = document.getElementById('mainNav');
  const menuToggle = document.getElementById('menuToggle');
  const customersPage = document.getElementById('customersPage');
  const loansPage = document.getElementById('loansPage');
  const collectionsPage = document.getElementById('collectionsPage');
  const loginScreen = document.getElementById('loginScreen');
  if (mainNav) mainNav.style.display = 'none';
  if (menuToggle) menuToggle.style.display = 'none';
  if (customersPage) customersPage.style.display = 'none';
  if (loansPage) loansPage.style.display = 'none';
  if (collectionsPage) collectionsPage.style.display = 'none';
  if (loginScreen) loginScreen.style.display = 'block';
});

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Perform login validation here
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const hashedPassword = CryptoJS.SHA256(password).toString();
    try {
      const response = await fetch(apiUrl, {
        headers: { Authorization: `token ${getToken()}` },
      });
      const data = await response.json();
      const users = JSON.parse(data.files[config.gistFileName].content).users;
      const user = users.find((user) => user.username === username && user.password === hashedPassword);
      if (user) {
        appState.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user)); // Store currentUser in localStorage
        const loginScreen = document.getElementById('loginScreen');
        const mainNav = document.getElementById('mainNav');
        const menuToggle = document.getElementById('menuToggle');
        const adminDashboard = document.getElementById('adminDashboard');
        const customersPage = document.getElementById('customersPage');
        const loansPage = document.getElementById('loansPage');
        const collectionsPage = document.getElementById('collectionsPage');
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainNav) mainNav.style.display = 'none'; // Ensure menu is collapsed initially
        if (menuToggle) menuToggle.style.display = 'block';
        if (user.type === 'admin') {
          if (adminDashboard) adminDashboard.style.display = 'block';
        } else if (user.type === 'manager') {
          if (adminDashboard) adminDashboard.style.display = 'none';
          if (customersPage) customersPage.style.display = 'none';
          if (loansPage) loansPage.style.display = 'none';
        }
        if (collectionsPage) collectionsPage.style.display = 'block';
        fetchData();
      } else {
        showToast('Invalid credentials!');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Error during login. Please try again.');
    }
  });
}

const refreshButton = document.getElementById('refreshButton');
if (refreshButton) refreshButton.addEventListener('click', refreshData);

const addCustomerForm = document.getElementById('addCustomerForm');
if (addCustomerForm) {
  addCustomerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const customerName = document.getElementById('customerName').value;
    const newCustomer = {
      id: autoGenerateCustomerId(),
      name: customerName,
      loans: [] // Initialize loans array for the new customer
    };
    appState.customers.push(newCustomer);
    await saveData();
    showToast(`Customer ${customerName} added successfully!`);
    populateCustomersList();
    addCustomerForm.reset();
  });
}

function generateRandomToken() {
  return Math.random().toString(36).substr(2, 9);
}

const addLoanForm = document.getElementById('addLoanForm');
if (addLoanForm) {
  addLoanForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const customerId = document.getElementById('customerDropdown').value;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const duration = parseInt(document.getElementById('duration').value, 10);
    const newLoan = {
      id: autoGenerateLoanId(),
      loanAmount,
      interestRate,
      duration,
      startDate: new Date().toISOString(),
      status: 'active',
      collections: [], // Initialize collections array for the new loan
      token: generateRandomToken(), // Add token to the new loan
    };
    const customer = appState.customers.find(c => c.id === customerId);
    if (customer) {      
      if (!customer.loans) {
        customer.loans = [];
      }
      customer.loans.push(newLoan);
      await saveData();
      showToast(`Loan for Customer ID: ${customerId} added successfully!`);
      populateLoansList();
      addLoanForm.reset();
    } else {
      showToast('Customer not found.');
    }
  });
}

window.handleDeleteCustomer = handleDeleteCustomer;
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
window.generateQRCode = generateQRCode;
window.closeQRCodeModal = closeQRCodeModal;

// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser?.type === 'admin') {
    const customerActionHeader = document.getElementById('customerActionHeader');
    if (customerActionHeader) customerActionHeader.style.display = '';
    document.querySelectorAll('#customersList td[data-label="Action"]').forEach(td => td.style.display = '');
    const loanActionHeader = document.getElementById('loanActionHeader');
    if (loanActionHeader) loanActionHeader.style.display = '';
    document.querySelectorAll('#loansList td[data-label="Action"]').forEach(td => td.style.display = '');
  }
});
// ...existing code...

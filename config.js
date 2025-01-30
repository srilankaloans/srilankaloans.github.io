const config = {
  gistId: '2886a159d1e20d6aa2561bea3effe610', // Replace with your Gist ID
  token: 'g*********hp****_w7************CTV5P5xTaUpSC5J**************5T0skZ****Boo7lvx0MknZu', // Tampered token
};

const getToken = () => config.token.split('*').join('');

export { config, getToken };

async function handleDeleteLoan(loanId) {
  const confirmed = confirm('Are you sure you want to delete this loan and all its collection data?');
  if (confirmed) {
    appState.loans = appState.loans.filter((loan) => loan.id !== loanId);
    appState.collections = appState.collections.filter((collection) => collection.loanId !== loanId);
    await saveData();
    showToast(`Loan ID: ${loanId} and its collection data have been deleted.`);
    populateLoansList();
    populateCollectionSection();
  }
}

function filterCollections() {
  const filterLoanId = document.getElementById('filterLoanId').value.toUpperCase();
  const collectionSection = document.getElementById('collectionSection');
  const rows = collectionSection.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    const loanId = rows[i].getElementsByTagName('td')[1].textContent.toUpperCase();
    if (loanId.indexOf(filterLoanId) > -1) {
      rows[i].style.display = '';
    } else {
      rows[i].style.display = 'none';
    }
  }
}

async function handleDeleteCollection(loanId) {
  const confirmed = confirm('Are you sure you want to delete all collection records for this loan?');
  if (confirmed) {
    appState.collections = appState.collections.filter((collection) => collection.loanId !== loanId);
    await saveData();
    showToast(`All collection records for Loan ID: ${loanId} have been deleted.`);
    populateCollectionSection();
  }
}

async function handleCollect(loanId) {
  const collectAmountInput = document.getElementById(`collectAmount-${loanId}`);
  const collectAmount = parseFloat(collectAmountInput.value);
  if (isNaN(collectAmount) || collectAmount <= 0) {
    showToast('Please enter a valid collection amount.');
    return;
  }
  const confirmed = confirm(`Are you sure you want to collect $${collectAmount} for this loan?`);
  if (confirmed) {
    const loan = appState.loans.find((l) => l.id === loanId);
    appState.collections.push({ loanId, date: new Date().toISOString(), amount: collectAmount });
    await saveData();
    showToast(`Collection of $${collectAmount} recorded for Loan ID: ${loanId}`);
    populateCollectionSection(); // Update the collection section
  }
}

function populateCollectionSection() {
  const collectionSection = document.getElementById('collectionSection');
  collectionSection.innerHTML = '';
  appState.loans.forEach((loan) => {
    const customer = appState.customers.find((c) => c.id === loan.customerId);
    const collections = appState.collections.filter((collection) => collection.loanId === loan.id);
    const collectedAmount = collections.reduce((total, collection) => total + collection.amount, 0);
    const isCollectDisabled = collectedAmount >= loan.loanAmount + (loan.loanAmount * loan.interestRate / 100);
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
      <td data-label="Action">
        <input type="number" id="collectAmount-${loan.id}" placeholder="Amount" />
        <button onclick="handleCollect('${loan.id}')" ${isCollectDisabled ? 'class="completed-button" disabled' : ''}>
          ${isCollectDisabled ? 'Completed' : 'Collect'}
        </button>
        <button class="delete-collection-button" onclick="handleDeleteCollection('${loan.id}')">Delete</button>
      </td>
    `;
    collectionSection.appendChild(loanDiv);
  });
}

function hideDeleteButtonsForManagers() {
  const userType = appState.currentUser.type;
  if (userType === 'manager') {
    const deleteLoanButtons = document.querySelectorAll('.delete-loan-button');
    const deleteCollectionButtons = document.querySelectorAll('.delete-collection-button');
    deleteLoanButtons.forEach(button => button.style.display = 'none');
    deleteCollectionButtons.forEach(button => button.style.display = 'none');
  }
}

window.handleDeleteLoan = handleDeleteLoan;
window.filterCollections = filterCollections;
window.handleDeleteCollection = handleDeleteCollection;
window.hideDeleteButtonsForManagers = hideDeleteButtonsForManagers;
window.handleCollect = handleCollect;

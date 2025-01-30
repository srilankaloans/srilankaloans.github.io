const config = {
  gistId: '2886a159d1e20d6aa2561bea3effe610', // Replace with your Gist ID
  token: 'g***hp_g8GAqe***6FNerPk4algf***dt3HHczOzM***uE0zGmEz', // Tampered token
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

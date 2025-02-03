import { config, getToken, apiUrl, setupTableSorting, setupPagination, appState } from './config.js';

// ...existing code...

document.addEventListener('DOMContentLoaded', () => {
  setupTableSorting('customersTable');
  setupPagination('customersTable', 10);
  setupTableSorting('loansTable');
  setupPagination('loansTable', 10);
  setupTableSorting('collectionTable');
  setupPagination('collectionTable', 10);

  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      mainNav.style.display = mainNav.style.display === 'block' ? 'none' : 'block';
    });
  }
});

// ...existing code...

function showCollectionDetails(loanId) {
  const modal = document.getElementById('collectionDetailsModal');
  const modalContent = document.getElementById('collectionDetailsContent');
  let collections = [];
  let loanAmount = 0;
  let interestRate = 0;

  appState.customers.forEach(customer => {
    customer.loans.forEach(loan => {
      if (loan.id === loanId) {
        collections = loan.collections;
        loanAmount = loan.loanAmount;
        interestRate = loan.interestRate;
      }
    });
  });

  const totalAmountDue = loanAmount + (loanAmount * interestRate / 100);
  let collectedAmount = 0;

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  modalContent.innerHTML = `
    <h3>Collections for Loan ID: ${loanId}</h3>
    <table class="responsive-table" id="modalCollectionTable">
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount Due</th> <!-- Add Amount Due column header -->
          <th>Amount</th>
          ${currentUser?.type === 'admin' ? '<th>Action</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${collections.map(collection => {
          collectedAmount += collection.amount;
          const remainingAmountDue = totalAmountDue - collectedAmount;
          return `
            <tr>
              <td>${new Date(collection.date).toLocaleDateString()}</td>
              <td>${remainingAmountDue.toFixed(2)}</td> <!-- Add Amount Due column data -->
              <td>${collection.amount.toFixed(2)}</td>
              ${currentUser?.type === 'admin' ? `<td><button onclick="handleDeleteCollectionItem('${loanId}', '${collection.date}')"><i class="fas fa-trash-alt"></i></button></td>` : ''}
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    <div id="paginationContainerModal"></div> <!-- Add pagination container for modal -->
    <button class="close-button" onclick="closeCollectionDetails()">Close</button>
  `;
  modal.classList.add('show');
}

window.showCollectionDetails = showCollectionDetails;


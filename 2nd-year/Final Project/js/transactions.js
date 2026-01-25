function initTransactions() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html?redirect=transactions.html';
        return;
    }
    
    const transactionsList = document.getElementById('transactionsList');
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Filter transactions for current user
    const userTransactions = transactions.filter(t => t.userId === user.playerId);
    
    if (userTransactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="no-transactions">
                <img src="images/empty-transactions.png" alt="No transactions">
                <p>No transactions yet. Time to prepare for trouble!</p>
                <a href="index.html" class="btn btn-red">SHOP NOW</a>
            </div>
        `;
        return;
    }
    
    // Clear previous content
    transactionsList.innerHTML = '';
    
    // Sort by date (newest first)
    userTransactions.sort((a, b) => b.id - a.id);
    
    // Display each transaction
    userTransactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        
        const date = new Date(transaction.id);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        const itemsList = transaction.items.map(item => 
            `${item.name} × ${item.quantity} (${item.price})`
        ).join(', ');
        
        transactionElement.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-date">${formattedDate}</div>
                <div class="transaction-items">${itemsList}</div>
            </div>
            <div class="transaction-amount">${transaction.total}</div>
        `;
        
        transactionsList.appendChild(transactionElement);
    });
}

// Initialize transactions if on transactions page
if (document.getElementById('transactionsList')) {
    document.addEventListener('DOMContentLoaded', initTransactions);
}
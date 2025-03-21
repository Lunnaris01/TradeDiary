// Tab Switching
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Fetch and display trades when the "Show Trades" tab is clicked
const showTradesTab = document.querySelector('[data-tab="show-trades"]');
showTradesTab.addEventListener('click', fetchAndDisplayTrades);

// Fetch and display trades when the page loads (if the "Show Trades" tab is active)
document.addEventListener('DOMContentLoaded', () => {
    if (showTradesTab.classList.contains('active')) {
        fetchAndDisplayTrades();
    }
});

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to the clicked button and corresponding content
        const tabId = button.getAttribute('data-tab');
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Form Submission
const addTradeForm = document.getElementById('add-trade-form');

addTradeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get the access token from localStorage
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
        alert("You are not logged in. Please log in to add a trade.");
        return;
    }

    // Prepare the trade data
    const formData = new FormData(addTradeForm);
    const tradeData = {
        symbol: formData.get('symbol'),
        price: parseFloat(formData.get('price')),
        order_type: formData.get('order_type'),
        order_time: formData.get('order_time'),
    };

    try {
        // Send the POST request with the access token in the headers
        const response = await fetch('/api/trades', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`, // Add the Bearer token
            },
            body: JSON.stringify(tradeData),
        });

        if (response.ok) {
            alert('Trade added successfully!');
            addTradeForm.reset();
        } else {
            const errorData = await response.json();
            alert(`Failed to add trade: ${errorData.error || "Unknown error"}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the trade.');
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Set the "Show Trades" tab as active by default
    const showTradesTab = document.querySelector("#show-trades");
    showTradesTab.classList.add("active");

    // Fetch and display trades
    fetchAndDisplayTrades();
});

async function fetchAndDisplayTrades() {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
        alert("You are not logged in. Please log in to view trades.");
        return;
    }

    try {
        // Fetch trades from the backend
        const response = await fetch('/api/trades', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch trades");
        }

        const trades = await response.json();
        console.log("Trades Data:", trades);

        // Clear the existing table rows
        const tableBody = document.querySelector("#trades-table tbody");
        if (!tableBody) {
            console.error("Table body not found. Ensure the <tbody> element exists in the HTML.");
            return;
        }
        tableBody.innerHTML = "";

        // Populate the table with trades
        trades.forEach(trade => {
            const row = document.createElement("tr");

            // Type column
            const typeCell = document.createElement("td");
            typeCell.textContent = trade.order_type === "buy" ? "B" : "S";
            row.appendChild(typeCell);

            // Symbol column
            const symbolCell = document.createElement("td");
            symbolCell.textContent = trade.symbol;
            row.appendChild(symbolCell);

            // Price column
            const priceCell = document.createElement("td");
            priceCell.textContent = trade.price.toFixed(2);
            row.appendChild(priceCell);

            // Time column
            const timeCell = document.createElement("td");
            const orderTime = new Date(trade.order_time).toLocaleString();
            timeCell.textContent = orderTime;
            row.appendChild(timeCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
        alert(`An error occurred while fetching trades: ${error.message}`);
    }
}
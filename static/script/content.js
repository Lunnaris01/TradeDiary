document.addEventListener("DOMContentLoaded", function () {
    // Initialize Flatpickr for the order-time input
    flatpickr("#order-time", {
        enableTime: true, // Enable time selection
        dateFormat: "Y-m-d H:i", // Format: YYYY-MM-DD HH:MM
        time_24hr: true, // Use 24-hour format
        minuteIncrement: 1, // Optional: Set minute increments
        defaultDate: "today", // Optional: Set default date to today
    });

    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to the clicked button and corresponding content
            const tabId = button.getAttribute('data-tab');
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Fetch and display trades if the "Show Trades" tab is clicked
            if (tabId === "show-trades") {
                fetchAndDisplayTrades();
            }
        });
    });

    // Set the "Show Trades" tab as active by default
    const showTradesTab = document.querySelector('[data-tab="show-trades"]');
    showTradesTab.classList.add('active');
    document.getElementById('show-trades').classList.add('active');

    // Fetch and display trades when the page loads
    fetchAndDisplayTrades();

    // Handle form submission for adding a trade
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
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(tradeData),
            });

            if (response.ok) {
                alert('Trade added successfully!');
                addTradeForm.reset();
                fetchAndDisplayTrades(); // Refresh the trades list
            } else {
                const errorData = await response.json();
                alert(`Failed to add trade: ${errorData.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while adding the trade.');
        }
    });
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
            const idCell = document.createElement("td");
            idCell.textContent = trade.id;
            row.appendChild(idCell);

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

            // Close Trade column
            const closeCell = document.createElement("td");
            if (!trade.close_time) { // Only show the button for open trades
                const closeButton = document.createElement("button");
                closeButton.textContent = "Close Trade";
                closeButton.classList.add("btn", "close-trade-btn");
                closeButton.addEventListener("click", () => openCloseTradeModal(trade.id));
                closeCell.appendChild(closeButton);
            } else {
                closeCell.textContent = "Closed";
            }
            row.appendChild(closeCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
        alert(`An error occurred while fetching trades: ${error.message}`);
    }
}

// Open the Close Trade modal
function openCloseTradeModal(tradeId) {
    const modal = document.getElementById("close-trade-modal");
    modal.style.display = "block";

    // Initialize Flatpickr for the close-time input
    flatpickr("#close-time", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        minuteIncrement: 1,
        defaultDate: "today",
    });

    // Handle form submission
    const closeTradeForm = document.getElementById("close-trade-form");
    closeTradeForm.onsubmit = async (event) => {
        event.preventDefault();

        const closeTime = document.getElementById("close-time").value;

        try {
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                alert("You are not logged in. Please log in to close a trade.");
                return;
            }

            // Send the UPDATE request to close the trade
            const response = await fetch(`/api/trades/${tradeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ close_time: closeTime }),
            });

            if (response.ok) {
                alert("Trade closed successfully!");
                modal.style.display = "none";
                fetchAndDisplayTrades(); // Refresh the trades list
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to close trade");
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred while closing the trade: ${error.message}`);
        }
    };

    // Close the modal when the close button is clicked
    const closeModalButton = document.querySelector(".close-modal");
    closeModalButton.onclick = () => {
        modal.style.display = "none";
    };

    // Close the modal when clicking outside the modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
}
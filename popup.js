document.addEventListener("DOMContentLoaded", () => {
	const urlInput = document.getElementById("url");
	const timestampInput = document.getElementById("timestamp");
	const categoryInput = document.getElementById("category");
	const notesInput = document.getElementById("notes");
	const saveButton = document.getElementById("saveButton");
	const clearButton = document.getElementById("clearButton");
	const filterInput = document.getElementById("filter");
	const sortSelect = document.getElementById("sort");
	const bookmarkList = document.getElementById("bookmarkList");

	// Get current tab URL
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		urlInput.value = tabs[0].url;
	});

	saveButton.addEventListener("click", () => {
		const timestamp = timestampInput.value;
		const category = categoryInput.value;
		const notes = notesInput.value;

		if (!timestamp) {
			alert("Please enter a timestamp.");
			return;
		}

		chrome.runtime.sendMessage(
			{
				action: "saveBookmark",
				data: {
					url: urlInput.value,
					timestamp: timestamp,
					category: category,
					notes: notes,
				},
			},
			(response) => {
				if (chrome.runtime.lastError) {
					alert(
						"Error communicating with background script: " +
							chrome.runtime.lastError.message
					);
				} else {
					if (response && response.success) {
						alert("Bookmark saved successfully!");
						loadBookmarks();
					} else {
						alert(
							"Error saving bookmark: " +
								(response.error || "Unknown error.")
						);
					}
				}
			}
		);

		timestampInput.value = "";
		categoryInput.value = "";
		notesInput.value = "";
	});

	bookmarkList.addEventListener("click", (event) => {
		if (event.target.tagName === "A") {
			return; // Prevent default link behavior
		}

		const listItem = event.target.closest("li");
		if (listItem) {
			if (confirm("Are you sure you want to delete this bookmark?")) {
				const index = Array.from(bookmarkList.children).indexOf(
					listItem
				);
				chrome.runtime.sendMessage(
					{ action: "deleteBookmark", index: index },
					(response) => {
						if (chrome.runtime.lastError) {
							alert(
								"Error deleting bookmark: " +
									chrome.runtime.lastError.message
							);
						} else {
							if (response && response.success) {
								loadBookmarks();
							} else {
								alert(
									"Error deleting bookmark: " +
										(response.error || "Unknown error.")
								);
							}
						}
					}
				);
			}
		}
	});

	clearButton.addEventListener("click", () => {
		if (confirm("Are you sure you want to clear all bookmarks?")) {
			chrome.runtime.sendMessage(
				{ action: "clearAllBookmarks" },
				(response) => {
					if (chrome.runtime.lastError) {
						alert(
							"Error clearing bookmarks: " +
								chrome.runtime.lastError.message
						);
					} else {
						if (response && response.success) {
							alert("All bookmarks cleared.");
							loadBookmarks();
						} else {
							alert(
								"Error clearing bookmarks: " +
									(response.error || "Unknown error.")
							);
						}
					}
				}
			);
		}
	});

	filterInput.addEventListener("input", () => {
		loadBookmarks();
	});

	sortSelect.addEventListener("change", () => {
		loadBookmarks();
	});

	const exportButton = document.getElementById("exportButton");
	const importButton = document.getElementById("importButton");
	const importFile = document.getElementById("importFile");

	exportButton.addEventListener("click", () => {
		chrome.storage.local.get("bookmarks", (result) => {
			const bookmarks = result.bookmarks || [];

			const data = JSON.stringify(bookmarks, null, 2); // Convert bookmarks to JSON string
			const blob = new Blob([data], { type: "application/json" });
			const url = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.href = url;
			a.download = "youtube_bookmarks.json";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		});
	});

	importButton.addEventListener("click", () => {
		importFile.click();
	});

	importFile.addEventListener("change", (event) => {
		const file = event.target.files[0];
		const reader = new FileReader();

		reader.onload = (event) => {
			try {
				const importedBookmarks = JSON.parse(event.target.result);
				chrome.storage.local.set(
					{ bookmarks: importedBookmarks },
					() => {
						alert("Bookmarks imported successfully!");
						loadBookmarks();
					}
				);
			} catch (error) {
				alert("Error importing bookmarks: " + error.message);
			}
		};

		reader.readAsText(file);
	});

	function loadBookmarks() {
		chrome.storage.local.get("bookmarks", (result) => {
			const bookmarks = result.bookmarks || [];
			const filterText = filterInput.value.toLowerCase();
			const sortOrder = sortSelect.value;

			let sortedBookmarks = [...bookmarks];

			if (sortOrder === "asc") {
				sortedBookmarks.sort((a, b) =>
					a.timestamp.localeCompare(b.timestamp)
				);
			} else if (sortOrder === "desc") {
				sortedBookmarks.sort((a, b) =>
					b.timestamp.localeCompare(a.timestamp)
				);
			}

			bookmarkList.innerHTML = "";
			sortedBookmarks.forEach((bookmark) => {
				if (
					filterText === "" ||
					bookmark.category.toLowerCase().includes(filterText)
				) {
					const listItem = document.createElement("li");
					listItem.innerHTML = `
			  <a href="${bookmark.url}" target="_blank">${bookmark.url}</a> 
			  - ${bookmark.timestamp} 
			  <span class="category">(${bookmark.category})</span>
			  <span class="notes">${bookmark.notes ? ` - ${bookmark.notes}` : ""}</span>
			`;
					bookmarkList.appendChild(listItem);
				}
			});
		});
	}

	loadBookmarks();
});

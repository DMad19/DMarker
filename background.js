chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "saveBookmark") {
		const { url, timestamp, category, notes } = request.data;
		const newBookmark = { url, timestamp, category, notes };

		chrome.storage.local.get("bookmarks", (result) => {
			let bookmarks = result.bookmarks || [];
			bookmarks.push(newBookmark);

			chrome.storage.local.set({ bookmarks }, () => {
				sendResponse({ success: true });
			});
		});
	} else if (request.action === "deleteBookmark") {
		chrome.storage.local.get("bookmarks", (result) => {
			let bookmarks = result.bookmarks || [];
			bookmarks.splice(request.index, 1);

			chrome.storage.local.set({ bookmarks: bookmarks }, () => {
				sendResponse({ success: true });
			});
		});
	} else if (request.action === "clearAllBookmarks") {
		chrome.storage.local.set({ bookmarks: [] }, () => {
			sendResponse({ success: true });
		});
	}

	return true;
});

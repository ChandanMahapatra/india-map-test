import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();

	const consoleMessages = [];
	const errors = [];

	page.on('console', (msg) => {
		consoleMessages.push({ type: msg.type(), text: msg.text() });
	});
	page.on('pageerror', (err) => errors.push(err.message));

	try {
		await page.goto('file:///Users/chan9893/Documents/GitHub/india-map-test/index.html', {
			waitUntil: 'networkidle',
			timeout: 30000
		});
		await page.waitForTimeout(8000);

		// Click on the map to test
		const canvas = await page.$('canvas');
		if (canvas) {
			const box = await canvas.boundingBox();
			// Click near center of India
			await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
			await page.waitForTimeout(2000);
		}

		console.log('\n=== Console Messages ===');
		consoleMessages.forEach((msg) => {
			console.log(`[${msg.type}] ${msg.text}`);
		});

		// Check for popup
		const popup = await page.$('.maplibregl-popup, [class*="popup"]');
		console.log('\nPopup exists:', !!popup);

		if (popup) {
			const popupHTML = await popup.innerHTML();
			console.log('Popup content:', popupHTML.substring(0, 300));
		}
	} catch (error) {
		console.log('Error:', error.message);
	}

	await browser.close();
})();

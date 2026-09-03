(function () {
	"use strict";
	// General Helpers
	function escapeHTML(value) {
		return String(value == null ? "" : value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}
	function textValue(id) {
		var element = document.getElementById(id);
		if (!element) { return ""; }
		return element.value || "";
	}
	function isChecked(id) {
		var element = document.getElementById(id);
		return element ? element.checked : false;
	}
	function getLabel(id) {
		var label = document.querySelector( 'label[for="' + id + '"]' );
		if (!label) { return ""; }
		return label.textContent.replace(/\s+/g, " ").trim();
	}
	// JSON Export
	function exportJSON() {
		var form = document.querySelector(  "#generator form" );
		if (!form) {
			console.error( "WSG Report: generator form not found." );
			return; }
		var data = {};
		form.querySelectorAll( "input, textarea, select" ).forEach(function (element) {
			if (!element.id) { return; }
			if ( element.type === "checkbox" || element.type === "radio" ) {
				data[element.id] = { type: element.type, value: element.checked };
			} else { data[element.id] = { type: element.tagName.toLowerCase(), value: element.value }; } });
		var blob = new Blob( [ JSON.stringify( data, null, 2 ) ], { type: "application/json" } );
		var url = URL.createObjectURL(blob);
		var link = document.createElement("a");
		link.href = url;
		link.download = "wsg-report.json";
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	}
	// JSON Import
	function importJSON() {
		var input = document.createElement("input");
		input.type = "file";
		input.accept = ".json,application/json";
		input.addEventListener("change", function () {
				if (!input.files.length) { return; }
				var reader = new FileReader();
				reader.onload =
					function () {
						try {
							var data = JSON.parse( reader.result );
							Object.keys(data).forEach(
								function (id) {
									var element = document.getElementById(id);
									if (!element) { return; }
									if ( element.type === "checkbox" || element.type === "radio" ) {
										element.checked = Boolean( data[id].value );
									} else { element.value = data[id].value; } } );
							alert( "WSG Report imported successfully." );
						} catch (error) { console.error( "WSG Report JSON import error:", error );
							alert( "The selected file is not valid WSG Report JSON." ); } };
				reader.readAsText( input.files[0] ); } );
		input.click();
	}
	// Application of Sustainability
	function buildSustainabilityApplication() {
		var frameworkIDs = [
			"wsg", "gpf", "gr491", "sdgs", "gri", "sci",
			"iso", "ascrsm", "csrd", "espr", "gtd", "eed", "reen" ];
		var frameworks = [];
		frameworkIDs.forEach(function (id) {
			if (isChecked(id)) {
				var label = getLabel(id);
				if (label) { frameworks.push(label); } } });
		["otherText", "otherText2", "otherText3"].forEach(function (id) {
			var value = textValue(id).trim();
			if (value) { frameworks.push(value); } });
		var frameworkList;
		if (frameworks.length) {
			frameworkList =
				"<ul>" +
				frameworks.map(function (item) { return "<li>" + escapeHTML(item) + "</li>"; }).join("") +
				"</ul>";
		} else { frameworkList = '<span class="wsg-report-not-provided">Not specified</span>'; }
		return (
			"<h2>Application of Sustainability</h2>" +
			"<p>The organisation's sustainability practices are assessed against the below best practices, standards and legislation:</p>" + frameworkList );
	}
	// Generate Preview
	function generatePreview() {
		var preview = document.getElementById("preview");
		if (!preview) {
			console.error("Preview section not found.");
			return; }
		var selects = document.querySelectorAll(
			"#efforts select.ux-conformance, " +
			"#efforts select.wd-conformance, " +
			"#efforts select.his-conformance, " +
			"#efforts select.bspm-conformance" );
		var sections = {};
		selects.forEach(function (select) {
		var fieldset = select.closest("fieldset");
		if (!fieldset) { return; }
		var details = fieldset.closest("details");
		var criterion = "";
		var category = "";
		if (details) {
			var summary = details.querySelector(":scope > summary");
			if (summary) { criterion = summary.textContent.replace(/\s+/g, " ").trim(); }
			var parentDetails = details.parentElement && details.parentElement.closest("details");
			if (parentDetails) {
				var parentSummary = parentDetails.querySelector( ":scope > summary" );
				if (parentSummary) { category = parentSummary.textContent
					.replace(/\s+/g, " ").trim().replace(/^Success Criteria\s*-\s*/i, ""); } } }

		// If a category couldn't be detected, put it into a sensible fallback section.

		if (!category) { category = "Web Sustainability Guidelines"; }
		var legend = fieldset.querySelector("legend");
		var successCriterion = "";
		if (legend) {
			var clone = legend.cloneNode(true);

			// Remove the "Success Criteria -" prefix from visible text only.
			var textNodes = [];
			var walker = document.createTreeWalker( clone, NodeFilter.SHOW_TEXT, null, false );
			var node;
			while (node = walker.nextNode()) { textNodes.push(node); }
			for (var i = 0; i < textNodes.length; i++) {
				textNodes[i].nodeValue = textNodes[i].nodeValue.replace( /^\s*Success Criteria\s*-\s*/i, "" ); }
			successCriterion = clone.innerHTML.trim(); }
		var option = select.options[ select.selectedIndex ];
		var result = option ? option.textContent.trim() : "Not checked";
		var textarea = fieldset.querySelector("textarea");
		var observations = textarea && textarea.value.trim() ? escapeHTML(textarea.value.trim()).replace(/\r?\n/g, "<br>") : "None";

		// Create the section if it doesn't exist.

		if (!sections[category]) { sections[category] = []; }

		// Add this criterion to its section.

		sections[category].push({
			criterion: criterion,
			successCriterion: successCriterion,
			result: result,
			observations: observations }); });

		// Build one table for each WSG section.

		var sectionTables = "";
		Object.keys(sections).forEach(function (category) {
			var sectionRows = "";
			var lastCriterion = null;
			sections[category].forEach(function (item) {
				if (item.criterion !== lastCriterion) {
					sectionRows +=
						"<tr>" +
							"<td colspan=\"3\"><strong>" + escapeHTML(item.criterion) + "</strong></td>" +
						"</tr>";
					lastCriterion = item.criterion; }
				sectionRows +=
					"<tr>" +
						"<td>" + item.successCriterion + "</td>" +
						"<td>" + escapeHTML(item.result) + "</td>" +
						"<td>" + item.observations + "</td>" +
					"</tr>"; });
			sectionTables +=
				"<h3>" + escapeHTML(category) + "</h3>" +
				"<table>" +
					"<thead>" +
						"<tr>" +
							"<th>" + "Criterion" + "</th>" +
							"<th>" + "Result" + "</th>" +
							"<th>" + "Observations" + "</th>" +
						"</tr>" +
					"</thead>" +
					"<tbody>" + sectionRows + "</tbody>" +
				"</table>"; });

			// Count results.

			var counts = {};

		// Always show every possible result, even when the count is zero.

		var resultTypes = [
			"Fully conformant",
			"Partially conformant",
			"Non conformant",
			"Non present",
			"Unable to assess",
			"Not checked" ];

		// Start every result at zero.

		resultTypes.forEach(function (result) { counts[result] = 0; });

		// Count the selected option for every criterion.

		selects.forEach(function (select) {
			var option = select.options[select.selectedIndex];
			var result = option ? option.textContent.trim() : "Not checked";

			// Include unexpected option text as well, rather than losing the count.

			if (!Object.prototype.hasOwnProperty.call(counts, result)) { counts[result] = 0; }
			counts[result]++; });

		// Build the Summary table.

		var summaryRows = "";
		Object.keys(counts).forEach(function (result) {
			summaryRows +=
				"<tr>" +
					"<th scope=\"row\">" + escapeHTML(result) + "</th>" +
					"<td>" + counts[result] + "</td>" +
				"</tr>"; });

		// Get the basic information.

		function field(id) {
			var element = document.getElementById(id);
			if (!element || !element.value.trim()) { return "Not provided"; }
			return element.value.trim(); }
		function textareaField(id) {
			var element = document.getElementById(id);
			if (!element || !element.value.trim()) { return "Not provided"; }
			return escapeHTML(element.value.trim()).replace(/\r?\n/g, "<br>"); }
		var organisation = field("org");
		var website = field("label");
		var url = field("url");
		var date = field("date");
		var phone = field("phone");
		var email = field("email");
		var address = field("address");
		var social = field("social");
		var duration = field("duration");
		var conform = document.querySelector('input[name="conform"]:checked');
		var conformText = conform ? escapeHTML(getLabel(conform.id))
        	.replace(/\babove\b/gi, "below").replace(/^([^:]+):/, "<strong>$1</strong>:") : "Not assessed";
		var complaints = textareaField("complaints");
		var moreStuff = textareaField("moreStuff");
		var greenwash = document.getElementById("greenwash");
		var greenwashLabel = greenwash ? getLabel("greenwash") : "";
		var greenwashText = greenwash ? "<strong>" + (greenwash.checked ? "Yes" : "No") + "</strong>" +
			(greenwashLabel ? ": " + escapeHTML( greenwashLabel
			.replace(/^Greenwashing:\s*/i, "")
			.replace(/\s*Evidence for claims should be provided in the above box if required\.?\s*$/i, "")
		   .trim() ) : "") : "Not provided";
		var approvedBy = field("name");
		var position = field("position");

		// Replace the preview contents completely.
		preview.innerHTML = "";
		var report = document.createElement("div");
		report.className = "wsg-preview-report";
		report.innerHTML =
			"<h1>" + escapeHTML( website === "Not provided" ? "WSG Report" : website ) + "</h1>" +
			"<h2>Basic Information</h2>" +
			"<dl>" +
				"<dt>Organisation</dt><dd>" + escapeHTML(organisation) + "</dd>" +
				"<dt>Website or application</dt><dd>" + escapeHTML(website) + "</dd>" +
				"<dt>Address of product or service</dt><dd>" + (url === "Not provided" ? escapeHTML(url) : "<a href=\"" + escapeHTML(url) + "\">" + escapeHTML(url) + "</a>") + "</dd>" +
				"<dt>Publication date</dt><dd>" + escapeHTML(date) + "</dd>" +
				"<dt>Overall conformance</dt><dd>" + conformText + "</dd>" +
				"<dt>Phone</dt><dd>" + (phone === "Not provided" ? escapeHTML(phone) : "<a href=\"tel:" + escapeHTML(phone) + "\">" + escapeHTML(phone) + "</a>") + "</dd>" +
				"<dt>E-mail</dt><dd>" + (email === "Not provided" ? escapeHTML(email) : "<a href=\"mailto:" + escapeHTML(email) + "\">" + escapeHTML(email) + "</a>") + "</dd>" +
				"<dt>Address</dt><dd>" + escapeHTML(address) + "</dd>" +
				"<dt>Other contact options</dt><dd>" + escapeHTML(social) + "</dd>" +
				"<dt>Typical duration for response</dt><dd>" + escapeHTML(duration) + "</dd>" +
				"<dt>Additional sustainability considerations</dt><dd>" + moreStuff + "</dd>" +
				"<dt>Greenwashing declaration</dt><dd>" + greenwashText + "</dd>" +
			"</dl>" +
			"<h2>Approval and Complaints Process</h2>" +
			"<dl>" +
				"<dt>Formal complaints procedure</dt><dd>" + complaints + "</dd>" +
				"<dt>Approved by</dt><dd>" + escapeHTML(approvedBy) + "</dd>" +
				"<dt>Position or function</dt><dd>" + escapeHTML(position) + "</dd>" +
			"</dl>" +
			buildSustainabilityApplication();
			if (document.querySelector('input[name="report-type"]:checked').value === "report") {
				report.innerHTML = report.innerHTML +"<h2>Summary</h2>" +
				"<p>" + "The assessment contains " + "<strong>" + selects.length + "</strong>" + " Web Sustainability Guidelines criteria." + "</p>" +
				"<table>" +
					"<thead>" +
						"<tr>" +
							"<th>Result</th>" +
							"<th>Number</th>" +
						"</tr>" +
					"</thead>" +
					"<tbody>" + summaryRows + "</tbody>" +
				"</table>" +
				"<h2>Web Sustainability Guidelines</h2>" +
				sectionTables; }
			var navigation = document.createElement("p");
		navigation.innerHTML =
			'<a class="button" href="#generator">' + 'Back to the generator' + '</a> ' +
			'<input type="submit" class="button" value="Download HTML" data-action="download-html"> ' +
			'<input type="submit" class="button" value="Download markdown" data-action="download-markdown"> ' +
			'<input type="submit" class="button" value="Export to JSON" data-action="export-json">';
		navigation.className = "wsg-report-preview-navigation";
		preview.appendChild(navigation);
		preview.appendChild(report);
	}
	// Global Click Handler
	document.addEventListener("click", function (event) {

		// Existing link-based controls.
		var link = event.target.closest("a.button");
		if (link) {
			var text = link.textContent.replace(/\s+/g, " ").trim();

			// Preview while allowing :target selector.
			if (link.matches('a[href="#preview"]') || text === "Preview results") {
				generatePreview();
				return; } }

		// Input-based controls.
		var input = event.target.closest("input.button");
		if (!input) { return; }
		var action = input.getAttribute("data-action");

		// Export JSON
		if (action === "export-json") {
			event.preventDefault();
			exportJSON();
			return; }

		// Import JSON
		if (action === "import-json") {
			event.preventDefault();
			importJSON();
			return; }

		// Download HTML
		if (action === "download-html") {
			event.preventDefault();
			downloadPreviewHTML();
			return; }

		// Download Markdown
		if (action === "download-markdown") {
			event.preventDefault();
			downloadPreviewMarkdown();
			return; }
	});
})();
// Preview Downloads
function downloadPreviewHTML() {
	var preview = document.getElementById("preview");
	if (!preview) { alert("Preview section could not be found."); return; }

	// Find the generated report.

	var report = preview.querySelector(".wsg-preview-report");
	if (!report) {
		alert("Please generate the WSG report preview first.");
		return; }

	// Clone the report so we don't change what is currently displayed on screen.

	var clone = report.cloneNode(true);

	// Remove preview-only navigation/buttons.

	clone.querySelectorAll( ".wsg-report-preview-navigation" ).forEach(function (element) { element.remove(); });

	// Create standalone HTML. No CSS is included.

	var html =
		"<!DOCTYPE html>\n" +
		"<html lang=\"en\">\n" +
		"<head>\n" +
		"	<meta charset=\"UTF-8\">\n" +
		"	<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
		"	<title>WSG Report</title>\n" +
		"</head>\n" +
		"<body>\n" + clone.outerHTML + "\n</body>\n" +
		"</html>";

	// Create file.

	var blob = new Blob( [html], { type: "text/html;charset=utf-8" } );
	var url = URL.createObjectURL(blob);
	var link = document.createElement("a");
	link.href = url;
	link.download = "wsg-report.html";
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
// Markdown Download
function downloadPreviewMarkdown() {
	var preview = document.getElementById("preview");
	if (!preview) {
		alert("Preview section could not be found.");
		return; }
	var report = preview.querySelector(".wsg-preview-report");
	if (!report) {
		alert("Please generate the WSG report preview first.");
		return; }

	// Convert HTML text into Markdown-safe text.

	function cleanText(text) {
		return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\|/g, "\\|").trim(); }
	var markdown = "";

	// Process an individual table.

	function convertTable(table) {
		var rows = Array.from( table.querySelectorAll("tr") );
		if (!rows.length) { return; }
		var firstCells = Array.from( rows[0].querySelectorAll( "th, td" ) );
		if (!firstCells.length) { return; }

		// Header.

		markdown += "| " + firstCells.map(function (cell) {
			return Array.from(cell.childNodes).map(function (node) {
			if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "a") {
				var linkText = cleanText(node.textContent);
				if (linkText === "Not provided") { return linkText; }
				return "[" + linkText + "](" + node.getAttribute("href") + ")"; }
			if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "br") { return "<br>"; }
			return cleanText(node.textContent);
			}).join(""); }).join(" | ") + " |\n";

		// Separator.

		markdown += "| " + firstCells.map(function () {
			return "---"; }).join(" | ") +" |\n";

		// Data rows.

		rows.slice(1).forEach(function (row) {
			var cells = Array.from( row.querySelectorAll( "th, td" ) );
			markdown += "| " + cells.map(function (cell) {
				return Array.from(cell.childNodes).map(function (node) {
			if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "a") {
			var linkText = cleanText(node.textContent);
			if (linkText === "Not provided") { return linkText; }
			return "[" + linkText + "](" + node.getAttribute("href") + ")"; }
			if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "br") { return "<br>"; }
			return cleanText(node.textContent);
		}).join(""); }).join(" | ") + " |\n"; });
		markdown += "\n"; }

	// Walk through the report.

	function process(element) {
		Array.from( element.children ).forEach(function (child) {
			var tag = child.tagName.toLowerCase();
			if (tag === "h1") {
				markdown += "# " + cleanText( child.textContent ) + "\n\n";
				return; }
			if (tag === "h2") {
				markdown += "## " + cleanText( child.textContent ) + "\n\n";
				return; }
			if (tag === "h3") {
				markdown += "### " + cleanText( child.textContent ) + "\n\n";
				return; }
			if (tag === "p") {
				var paragraph = Array.from(child.childNodes).map(function (node) {
					if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "br") { return "\n"; }
					return node.textContent; }).join("");
				paragraph = cleanText(paragraph);
				if (paragraph) { markdown += paragraph + "\n\n"; }
				return; }
			if (tag === "table") {
				convertTable(child);
				return; }
			if (tag === "header") {
				process(child);
				return; }
			if (tag === "section") {
				process(child);
				return; }
			if (tag === "ul") {
				Array.from( child.querySelectorAll( ":scope > li" ) ).forEach(function (item) {
					markdown += "- " + cleanText( item.textContent ) + "\n"; });
				markdown += "\n";
				return; }
			if (tag === "dl") {
				var terms = Array.from(child.querySelectorAll(":scope > dt"));
				terms.forEach(function (term) {
					var description = term.nextElementSibling;
					markdown += "**" + cleanText(term.textContent) + "**\n";
					if (description && description.tagName.toLowerCase() === "dd") {
						var descriptionText = Array.from(description.childNodes).map(function (node) {
							if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "a") {
								var linkText = cleanText(node.textContent);
								if (linkText === "Not provided") { return linkText; }
								return "[" + linkText + "](" + node.getAttribute("href") + ")"; }
							if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "br") { return "<br>"; }
							return node.textContent;
						}).join("");
						markdown += cleanText(descriptionText) + "\n\n"; } });
				return; }

			// Otherwise, process children if there are any.
			
			if (child.children.length) { process(child); } else {
				var text = cleanText( child.textContent );
				if (text) { markdown += text + "\n\n"; } } }); }

	// Convert the report.

	process(report);

	// Tidy up excessive blank lines.

	markdown = markdown.replace(/\n{3,}/g, "\n\n").trim() + "\n";

	// Create the Markdown file.

	var blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" } );
	var url = URL.createObjectURL(blob);
	var link = document.createElement("a");
	link.href = url;
	link.download = "wsg-report.md";
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
// Empty content redirect if preview is refreshed
if (window.location.hash === "#preview") {
	var preview = document.getElementById("preview");
	if (!preview || !preview.querySelector(".wsg-preview-report")) {
		window.location.hash = "#generator"; }
}
// Reset and bounce to the top
(function () {
    const form = document.querySelector('form');
    form.addEventListener('reset', function () { setTimeout(function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 0); });
})();
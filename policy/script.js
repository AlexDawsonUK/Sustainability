const results = document.querySelectorAll('#results ul dl');

// Q1: Data Type
function passesDataType(dl) {
	const resultType = dl.getAttribute('data-type');
	const selectedType = document.querySelector('#data-type').value;
	if (!resultType) { return true; }
	if (selectedType === 'guideline') { return true; }
	if (selectedType === 'standard') { return ( resultType === 'standard' || resultType === 'law' ); }
	if (selectedType === 'law') { return resultType === 'law'; }
	return false;
}
// Q2: Status
function passesStatus(dl) {
	const resultStatus = dl.getAttribute('data-status');
	const excludeStatus = document.querySelector('#data-status input[name="exclude"]').checked;
	if (!excludeStatus) { return true; }
	if ( resultStatus === 'awaiting' || resultStatus === 'historical' ) { return false; }
	return true;
}
// Q2: Region
function passesRegion(dl) {
	const resultRegion = dl.getAttribute('data-region');
	if (!resultRegion) { return true; }
	const selectedRegions = Array.from(document.querySelectorAll('#data-region input[name="region"]:checked')).map(function (input) {
		return input.value; });
	if (selectedRegions.length === 0) { return true; }
	return selectedRegions.includes(resultRegion);
}
// Q3: Employees
function passesEmployees(dl) {
	const resultEmployees = dl.getAttribute('data-employees');
	const selectedEmployees = document.querySelector('#data-employees').value;
	if (!resultEmployees) { return true; }
	return Number(selectedEmployees) >= Number(resultEmployees);
}
// Q4: Revenue
function passesRevenue(dl) {
	const resultRevenue = dl.getAttribute('data-revenue');
	const selectedRevenue = document.querySelector('#data-revenue').value;
	if (selectedRevenue === 'unsure') { return true; }
	if (!resultRevenue) { return true; }
	return resultRevenue === selectedRevenue;
}
// Q5: Listing
function passesListing(dl) {
	const resultListing = dl.getAttribute('data-listing');
	const selectedListing = document.querySelector('#data-listing').value;
	if (selectedListing === 'unsure') { return true; }
	if (!resultListing) { return true; }
	return resultListing === selectedListing;
}
// Q6: Service
function passesService(dl) {
	const resultService = dl.getAttribute('data-service');
	if (resultService === '') { return true; }
	const physicalChecked = document.querySelector('#data-service input[name="type"][value="physical"]').checked;
	const digitalChecked = document.querySelector('#data-service input[name="type"][value="digital"]').checked;
	if (!physicalChecked && !digitalChecked) { return resultService === 'none'; }
	if (physicalChecked && digitalChecked) {
		return resultService === 'physical' || resultService === 'digital' || resultService === 'both'; }
	if (physicalChecked) { return resultService === 'physical' || resultService === 'both'; }
	if (digitalChecked) { return resultService === 'digital' || resultService === 'both'; }
	return false;
}
// 07: Technology UI
(function () {
	const techQuestion = document.querySelector('#data-tech');
	const techInputs = techQuestion.querySelectorAll('input[name="tech"]');
	function updateTechOptions() {
		const noSelected = techQuestion.querySelector('input[name="uses"][value="no"]').checked;
		techInputs.forEach(function (input) {
			if (noSelected) { input.checked = false; }
			input.disabled = noSelected; }); }
	techQuestion.querySelectorAll('input[name="uses"]').forEach(function (input) { input.addEventListener('change', updateTechOptions); });
	document.querySelector('#questions form').addEventListener('reset', function () { setTimeout(updateTechOptions, 0); });
	updateTechOptions();
})();
// 07: Technology
function passesTech(dl) {
	const resultTech = dl.getAttribute('data-tech');
	if (!resultTech) { return true; }
	const noSelected = document.querySelector('#data-tech input[name="uses"][value="no"]').checked;
	if (noSelected) { return true; }
	const selectedTech = Array.from(document.querySelectorAll('#data-tech input[name="tech"]:checked')).map(function (input) {
		return input.value.toLowerCase(); });
	const resultTechValues = resultTech.split(',').map(function (value) { return value.trim().toLowerCase(); });
	return selectedTech.some(function (tech) { return resultTechValues.includes(tech); });
}
// 08: Reporting
function passesReport(dl) {
	const resultReport = dl.getAttribute('data-report');
	const selectedReport = document.querySelector('#data-report').value;
	if (selectedReport === 'unsure') { return true; }
	if (!resultReport) { return true; }
	return resultReport === selectedReport;
}
// Filter Results
function filterResults() {
	const runningResults = Array.from(results).filter(function (dl) {
	return passesDataType(dl) &&
		   passesStatus(dl) &&
		   passesRegion(dl) &&
		   passesEmployees(dl) &&
		   passesRevenue(dl) &&
		   passesListing(dl) &&
		   passesService(dl) &&
		   passesTech(dl) &&
		   passesReport(dl); });
	// Hide All Results
	results.forEach(function (dl) {
		const li = dl.closest('li');
		li.classList.remove('show');
		li.classList.add('hide'); });
	// Show Results That Pass Everything
	runningResults.forEach(function (dl) {
		const li = dl.closest('li');
		li.classList.remove('hide');
		li.classList.add('show'); });
	// Return number of matching results
	return runningResults.length;
}
// Show Everything
function showEverything() {
	results.forEach(function (dl) {
		const li = dl.closest('li');
		li.classList.remove('hide');
		li.classList.add('show'); });
}
// Buttons
document.querySelectorAll('.button').forEach(function (button) {
	button.addEventListener('click', function (event) {
		const buttonText = button.textContent.trim();
		// View Results
		if (buttonText === 'View results') {
			const physicalChecked = document.querySelector('#data-service input[name="type"][value="physical"]').checked;
			const digitalChecked = document.querySelector('#data-service input[name="type"][value="digital"]').checked;
			// At least one service type must be selected
			if (!physicalChecked && !digitalChecked) {
				event.preventDefault();
				alert('Please select at least one option from question 6.');
				return false; }
			const resultCount = filterResults();
			// No matching results
			if (resultCount === 0) {
				event.preventDefault();
				alert('There are no results matching your selections.');
				return false; } }
		// View Everything
		if (buttonText === 'Complete list') { showEverything(); } });
});
// Reset and bounce to the top
(function () {
    const form = document.querySelector('form');
    form.addEventListener('reset', function () { setTimeout(function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 0); });
})();
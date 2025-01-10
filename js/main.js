let scatterplot;
let map;
let selectedCountry = null;
let startYear = null;
let endYear = null;
let filteredVoteData = []; // Add this global variable

function initializeApp() {
    createFilterControls();
    loadData();
}

function createFilterControls() {
    const filterContainer = d3.select('#filter-container')
        .append('div')
        .attr('class', 'filters');

    const yearFilter = filterContainer.append('div')
        .attr('class', 'filter-group');

    yearFilter.append('label')
        .text('Start Year: ');

    yearFilter.append('select')
        .attr('id', 'start-year-select')
        .attr('class', 'filter-select')
        .on('change', function() {
            startYear = this.value || null;
            if (startYear) {
                updateEndYearOptions();
            }
            updateVisualizations();
        });

    yearFilter.append('label')
        .text('End Year: ');

    yearFilter.append('select')
        .attr('id', 'end-year-select')
        .attr('class', 'filter-select')
        .on('change', function() {
            endYear = this.value || null;
            if (endYear) {
                updateStartYearOptions();
            }
            updateVisualizations();
        });

    const countryFilter = filterContainer.append('div')
        .attr('class', 'filter-group');

    countryFilter.append('label')
        .text('Country: ');

    countryFilter.append('select')
        .attr('id', 'country-select')
        .attr('class', 'filter-select')
        .on('change', function() {
            selectedCountry = this.value;
            updateVisualizations();
        });
}

function loadData() {
    Promise.all([
        d3.csv("resources/contestants.csv"),
        d3.csv("resources/votes.csv")
    ]).then(([contestantsData, votesData]) => {
        processData(contestantsData, votesData);
        initializeFilters(contestantsData);
        initializeVisualizations(contestantsData, votesData);
    });
}

function processData(contestantsData, votesData) {
    contestantsData.forEach(d => {
        d.year = +d.year;
        d.place_contest = +d.place_contest;
    });

    votesData.forEach(d => {
        d.year = +d.year;
        d.total_points = +d.total_points;
    });
}

function initializeFilters(contestantsData) {
    const years = [...new Set(contestantsData.map(d => d.year))].sort();

    // Select start year
    const startYearSelect = d3.select('#start-year-select');
    startYearSelect.append('option')
        .attr('value', '')
        .text('Select Start Year');

    years.forEach(year => {
        startYearSelect.append('option')
            .attr('value', year)
            .text(year);
    });

    // Select end year
    const endYearSelect = d3.select('#end-year-select');
    endYearSelect.append('option')
        .attr('value', '')
        .text('Select End Year');

    years.forEach(year => {
        endYearSelect.append('option')
            .attr('value', year)
            .text(year);
    });

    // Select country
    const countries = [...new Set(contestantsData.map(d => d.country))].sort();
    const countrySelect = d3.select('#country-select');
    countrySelect.append('option')
        .attr('value', '')
        .text('Select Country');

    countries.forEach(country => {
        countrySelect.append('option')
            .attr('value', country)
            .text(country);
    });
}

function filterData(data) {
    let filteredData = data;

    if (startYear || endYear) {
        const start = startYear ? +startYear : -Infinity;
        const end = endYear ? +endYear : Infinity;

        filteredData = filteredData.filter(d => {
            const year = +d.year;
            return year >= start && year <= end;
        });
    }

    if (selectedCountry) {
        if ('country' in filteredData[0]) {
            filteredData = filteredData.filter(d => d.country === selectedCountry);
        } else {
            filteredData = filteredData.filter(d =>
                d.from_country_id === selectedCountry ||
                d.to_country_id === selectedCountry
            );
        }
    }

    return filteredData;
}

function updateVisualizations() {
    let filteredContestantData = filterData(scatterplot.data);
    let newFilteredVoteData = filterData(map.data);

    filteredVoteData = newFilteredVoteData;

    if (scatterplot) {
        const originalData = scatterplot.data;
        scatterplot.data = filteredContestantData;
        scatterplot.displayData = scatterplot.transformData();
        scatterplot.updateVis();
        scatterplot.data = originalData;
    }

    if (map) {
        updateMapVisualization(newFilteredVoteData);
    }
}

function initializeVisualizations(contestantsData, votesData) {
    scatterplot = new Scatterplot("scatterplot-container", contestantsData);
    scatterplot.initVis();

    initializeMap(votesData);
    map = {
        data: votesData,
        svg: d3.select('#map svg')
    };
}

// Update end year options based on selected start year
function updateEndYearOptions() {
    if (!startYear) return;

    const endYearSelect = d3.select('#end-year-select');
    const currentEndYear = endYearSelect.property('value');

    // Get all available years from both contestants and votes data
    const contestantYears = [...new Set(scatterplot.data.map(d => d.year))];
    const voteYears = [...new Set(map.data.map(d => d.year))];
    const years = [...new Set([...contestantYears, ...voteYears])].sort();

    // Filter years that are greater than or equal to start year
    const validEndYears = years.filter(year => year >= +startYear);

    // Keep current selection if it's valid
    const shouldKeepCurrentYear = currentEndYear && +currentEndYear >= +startYear;

    // Store current selection
    const currentSelection = endYearSelect.property('value');

    // Remove all existing options
    endYearSelect.selectAll('option').remove();

    // Add default option
    endYearSelect.append('option')
        .attr('value', '')
        .text('Select End Year')
        .property('selected', !currentSelection || !shouldKeepCurrentYear);

    // Add year options
    validEndYears.forEach(year => {
        endYearSelect.append('option')
            .attr('value', year)
            .text(year)
            .property('selected', year.toString() === currentSelection && shouldKeepCurrentYear);
    });

    // Update end year if current selection is no longer valid
    if (!shouldKeepCurrentYear) {
        endYear = null;
    }

    // Update visualizations
    updateVisualizations();
}

// Update start year options based on selected end year
function updateStartYearOptions() {
    if (!endYear) return;

    const startYearSelect = d3.select('#start-year-select');
    const currentStartYear = startYearSelect.property('value');

    // Get all available years from both contestants and votes data
    const contestantYears = [...new Set(scatterplot.data.map(d => d.year))];
    const voteYears = [...new Set(map.data.map(d => d.year))];
    const years = [...new Set([...contestantYears, ...voteYears])].sort();

    // Filter years that are less than or equal to end year
    const validStartYears = years.filter(year => year <= +endYear);

    // Keep current selection if it's valid
    const shouldKeepCurrentYear = currentStartYear && +currentStartYear <= +endYear;

    // Store current selection
    const currentSelection = startYearSelect.property('value');

    // Remove all existing options
    startYearSelect.selectAll('option').remove();

    // Add default option
    startYearSelect.append('option')
        .attr('value', '')
        .text('Select Start Year')
        .property('selected', !currentSelection || !shouldKeepCurrentYear);

    // Add year options
    validStartYears.forEach(year => {
        startYearSelect.append('option')
            .attr('value', year)
            .text(year)
            .property('selected', year.toString() === currentSelection && shouldKeepCurrentYear);
    });

    // Update start year if current selection is no longer valid
    if (!shouldKeepCurrentYear) {
        startYear = null;
    }

    // Update visualizations
    updateVisualizations();
}

// Initialize app when document is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
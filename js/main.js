function getCountryOptions() {
    return [
        'Albania', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
        'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus',
        'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France',
        'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland',
        'Ireland', 'Israel', 'Italy', 'Latvia', 'Lithuania',
        'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands',
        'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania',
        'Russia', 'San Marino', 'Serbia', 'Serbia and Montenegro', 'Slovakia',
        'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey',
        'Ukraine', 'England'
    ];
}

let scatterplot;
let map;
let selectedCountry = null;
let startYear = null;
let endYear = null;
let filteredVoteData = [];

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
            const countryData = {
                properties: { name: this.value }
            };
            handleCountryClick(null, countryData);
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

    
    const startYearSelect = d3.select('#start-year-select');
    startYearSelect.append('option')
        .attr('value', '')
        .text('Select Start Year');

    years.forEach(year => {
        startYearSelect.append('option')
            .attr('value', year)
            .text(year);
    });

    
    const endYearSelect = d3.select('#end-year-select');
    endYearSelect.append('option')
        .attr('value', '')
        .text('Select End Year');

    years.forEach(year => {
        endYearSelect.append('option')
            .attr('value', year)
            .text(year);
    });

    
    const countrySelect = d3.select('#country-select');
    countrySelect.selectAll('option').remove();

    countrySelect.append('option')
        .attr('value', '')
        .text('Select Country');

    const countries = getCountryOptions();
    countries.sort().forEach(country => {
        countrySelect.append('option')
            .attr('value', country)
            .text(country);
    });
}

function filterData(data) {
    if (!data || data.length === 0) return [];

    let filteredData = [...data];

    if (startYear || endYear) {
        const start = startYear ? +startYear : -Infinity;
        const end = endYear ? +endYear : Infinity;

        filteredData = filteredData.filter(d => {
            const year = +d.year;
            return year >= start && year <= end;
        });
    }

    if (selectedCountry) {
        
        const isContestantsData = 'country' in data[0];

        if (isContestantsData) {
            
            filteredData = filteredData.filter(d => d.country === selectedCountry);
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
        scatterplot.displayData = scatterplot.transformData(filteredContestantData);
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


function updateEndYearOptions() {
    if (!startYear) return;

    const endYearSelect = d3.select('#end-year-select');
    const currentEndYear = endYearSelect.property('value');

    
    const contestantYears = [...new Set(scatterplot.data.map(d => d.year))];
    const voteYears = [...new Set(map.data.map(d => d.year))];
    const years = [...new Set([...contestantYears, ...voteYears])].sort();

    
    const validEndYears = years.filter(year => year >= +startYear);

    
    const shouldKeepCurrentYear = currentEndYear && +currentEndYear >= +startYear;

    
    const currentSelection = endYearSelect.property('value');

    
    endYearSelect.selectAll('option').remove();

    
    endYearSelect.append('option')
        .attr('value', '')
        .text('Select End Year')
        .property('selected', !currentSelection || !shouldKeepCurrentYear);

    
    validEndYears.forEach(year => {
        endYearSelect.append('option')
            .attr('value', year)
            .text(year)
            .property('selected', year.toString() === currentSelection && shouldKeepCurrentYear);
    });

    
    if (!shouldKeepCurrentYear) {
        endYear = null;
    }

    
    updateVisualizations();
}


function updateStartYearOptions() {
    if (!endYear) return;

    const startYearSelect = d3.select('#start-year-select');
    const currentStartYear = startYearSelect.property('value');

    
    const contestantYears = [...new Set(scatterplot.data.map(d => d.year))];
    const voteYears = [...new Set(map.data.map(d => d.year))];
    const years = [...new Set([...contestantYears, ...voteYears])].sort();

    
    const validStartYears = years.filter(year => year <= +endYear);

    
    const shouldKeepCurrentYear = currentStartYear && +currentStartYear <= +endYear;

    
    const currentSelection = startYearSelect.property('value');

    
    startYearSelect.selectAll('option').remove();

    
    startYearSelect.append('option')
        .attr('value', '')
        .text('Select Start Year')
        .property('selected', !currentSelection || !shouldKeepCurrentYear);

    
    validStartYears.forEach(year => {
        startYearSelect.append('option')
            .attr('value', year)
            .text(year)
            .property('selected', year.toString() === currentSelection && shouldKeepCurrentYear);
    });

    
    if (!shouldKeepCurrentYear) {
        startYear = null;
    }

    
    updateVisualizations();
}

function countrySelected(d){
    scatterplot.country = d.properties.name;
    scatterplot.updateVis();
}


document.addEventListener('DOMContentLoaded', initializeApp);

function updateCountrySelect(countryName) {
    d3.select('#country-select').property('value', countryName);
    selectedCountry = countryName;
}
// List of Eurovision participating countries
const eurovisionCountries = [
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
const countryCodeToName = {
    'ad': 'Andorra',
    'al': 'Albania',
    'am': 'Armenia',
    'at': 'Austria',
    'au': 'Australia',
    'az': 'Azerbaijan',
    'ba': 'Bosnia and Herzegovina',
    'be': 'Belgium',
    'bg': 'Bulgaria',
    'by': 'Belarus',
    'ch': 'Switzerland',
    'cy': 'Cyprus',
    'cz': 'Czech Republic',
    'de': 'Germany',
    'dk': 'Denmark',
    'ee': 'Estonia',
    'es': 'Spain',
    'fi': 'Finland',
    'fr': 'France',
    'gb': 'England',
    'ge': 'Georgia',
    'gr': 'Greece',
    'hr': 'Croatia',
    'hu': 'Hungary',
    'ie': 'Ireland',
    'il': 'Israel',
    'is': 'Iceland',
    'it': 'Italy',
    'lt': 'Lithuania',
    'lu': 'Luxembourg',
    'lv': 'Latvia',
    'ma': 'Morocco',
    'mc': 'Monaco',
    'md': 'Moldova',
    'me': 'Montenegro',
    'mk': 'North Macedonia',
    'mt': 'Malta',
    'nl': 'Netherlands',
    'no': 'Norway',
    'pl': 'Poland',
    'pt': 'Portugal',
    'ro': 'Romania',
    'rs': 'Serbia',
    'ru': 'Russia',
    'se': 'Sweden',
    'si': 'Slovenia',
    'sk': 'Slovakia',
    'sm': 'San Marino',
    'tr': 'Turkey',
    'ua': 'Ukraine',
};

function initializeMap(initialVoteData) {
    filteredVoteData = initialVoteData;

    const width = 960;
    const height = 600;

    const svg = d3.select('#map')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    const projection = d3.geoMercator()
        .scale(650)
        .center([20, 52])
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', function(event) {
            svg.selectAll('path')
                .attr('transform', event.transform);
        });

    svg.call(zoom);

    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        .then(function(geoData) {
            const eurovisionData = geoData.features.filter(d =>
                eurovisionCountries.includes(d.properties.name)
            );

            svg.selectAll('path')
                .data(eurovisionData)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('class', 'country')
                .style('fill', '#69b3a2')
                .on('mouseover', handleMouseOver)
                .on('mousemove', handleMouseMove)
                .on('mouseout', handleMouseOut)
                .on('click', handleCountryClick);
        });
}

function handleMouseOver(event, d) {
    const hoverData = d3.select('body').node()._hoverData || {};
    const { clickedCountry, voters } = hoverData;

    let votesInfo = '';
    const votesByCountry = calculateVotesByCountry(filteredVoteData);

    if (clickedCountry && votesByCountry[d.properties.name]) {
        const totalVotes = votesByCountry[d.properties.name][clickedCountry] || 0;
        if (totalVotes > 0) {
            votesInfo = `<br><strong>Votes Given:</strong> ${totalVotes}`;
        }
    }

    if (!d3.select(this).classed('clicked')) {
        d3.select(this).style('fill', '#ff6347');
    }

    d3.select('.tooltip')
        .style('opacity', 1)
        .html(`<strong>Country:</strong> ${d.properties.name}${votesInfo}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 20) + 'px');
}

function handleMouseMove(event) {
    d3.select('.tooltip')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 20) + 'px');
}

function handleMouseOut() {
    if (!d3.select(this).classed('clicked')) {
        d3.select(this).style('fill', '#69b3a2');
    }
    d3.select('.tooltip').style('opacity', 0);
}

function handleCountryClick(event, d) {
    updateCountrySelect(d.properties.name);

    countrySelected(d);

    let newFilteredVoteData = filterData(map.data);

    updateMapVisualization(newFilteredVoteData);
}

function calculateVotesByCountry(voteData) {
    const votesByCountry = {};
    voteData.forEach(row => {
        const toCountry = countryCodeToName[row.to_country_id];
        const fromCountry = countryCodeToName[row.from_country_id];
        const totalPoints = parseInt(row.total_points, 10);

        if (toCountry && fromCountry && totalPoints > 0) {
            if (!votesByCountry[toCountry]) {
                votesByCountry[toCountry] = {};
            }
            if (!votesByCountry[toCountry][fromCountry]) {
                votesByCountry[toCountry][fromCountry] = 0;
            }
            votesByCountry[toCountry][fromCountry] += totalPoints;
        }
    });
    return votesByCountry;
}

function calculateColorIntensity(points, minPoints, maxPoints) {
    if (maxPoints === minPoints) {
        return 75;
    }
    return 50 + ((maxPoints - minPoints)/(points - minPoints) ) * 50;
}

function updateMapColors(countryName) {
    const clickedCountry = countryName;
    const votesByCountry = calculateVotesByCountry(filteredVoteData);

    const voters = [];
    let maxPoints = 0;
    let minPoints = Infinity;

    if (votesByCountry[clickedCountry]) {
        Object.entries(votesByCountry).forEach(([fromCountry, toCountryVotes]) => {
            const totalPoints = toCountryVotes[clickedCountry] || 0;
            if (totalPoints > 0) {
                voters.push({ country: fromCountry, points: totalPoints });
                maxPoints = Math.max(maxPoints, totalPoints);
                minPoints = Math.min(minPoints, totalPoints);
            }
        });
    }

    d3.select('body').node()._hoverData = {
        clickedCountry,
        voters,
        minPoints,
        maxPoints
    };

    const svg = d3.select('#map svg');

    svg.selectAll('.country')
        .style('fill', '#69b3a2')
        .classed('clicked', false);

    svg.selectAll('.country')
        .filter(d => d.properties.name === clickedCountry)
        .style('fill', 'rgb(0, 0, 0)')
        .classed('clicked', true);

    svg.selectAll('.country')
        .filter(function(d) {
            const voter = voters.find(v => v.country === d.properties.name);
            if (voter) {
                const intensity = calculateColorIntensity(voter.points, minPoints, maxPoints);
                const redValue = Math.round((255 - (intensity / 100) * 255));
                const greenValue = Math.round((intensity / 100) * 50);
                const colorValue = `rgb(${(255 - redValue)+100}, ${greenValue}, ${greenValue})`;

                d3.select(this).style('fill', colorValue);
                return true;
            }
            return false;
        })
        .classed('clicked', true);
}

function updateMapVisualization(filteredVotes) {
    // year filter
    let yearFilteredVotes = filteredVotes;
    if (startYear || endYear) {
        const start = startYear ? +startYear : -Infinity;
        const end = endYear ? +endYear : Infinity;

        yearFilteredVotes = yearFilteredVotes.filter(d => {
            const year = +d.year;
            return year >= start && year <= end;
        });
    }

    // country filter
    if (selectedCountry) {
        const selectedCountryCode = Object.entries(countryCodeToName)
            .find(([code, name]) => name === selectedCountry)?.[0];

        if (selectedCountryCode) {
            yearFilteredVotes = yearFilteredVotes.filter(d =>
                d.from_country_id === selectedCountryCode ||
                d.to_country_id === selectedCountryCode
            );
        }
    }

    // Update the global filtered vote data
    filteredVoteData = yearFilteredVotes;

    // Update map colors
    if (selectedCountry) {
        updateMapColors(selectedCountry);
    } else {
        const svg = d3.select('#map svg');
        svg.selectAll('.country')
            .style('fill', '#69b3a2')
            .classed('clicked', false);
    }
}

function updateCountrySelect(countryName) {
    d3.select('#country-select').property('value', countryName);
    selectedCountry = countryName;
}
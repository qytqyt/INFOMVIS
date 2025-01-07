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
    'Ukraine', 'United Kingdom'
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
    'gb': 'United Kingdom',
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


const width = 960;
const height = 600;

// Create an SVG element and append it to the map container
const svg = d3.select('#map')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// Create a tooltip for displaying country details on hover
const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

// Define a projection that focuses on Europe
const projection = d3.geoMercator()
    .scale(650) // Adjust scale for focus on Europe
    .center([20, 52]) // Center the map on Europe (Longitude, Latitude)
    .translate([width / 2, height / 2]);

// Define a path generator using the projection
const path = d3.geoPath().projection(projection);

// Zoom and Pan functionality
const zoom = d3.zoom()
    .scaleExtent([1, 8]) // Zoom in and out limits
    .on('zoom', function(event) {
        svg.selectAll('path')
            .attr('transform', event.transform);
    });

svg.call(zoom);

// Load the voting dataset
d3.csv('resources/votes.csv').then(function(voteData) {
    // Aggregate votes for each target country
    const votesByCountry = {};
    voteData.forEach(row => {
        const toCountry = countryCodeToName[row.to_country_id];
        const fromCountry = countryCodeToName[row.from_country_id];
        const totalPoints = parseInt(row.total_points, 10); // Parse total points as an integer

        if (toCountry && fromCountry && totalPoints > 0) {
            if (!votesByCountry[toCountry]) {
                votesByCountry[toCountry] = {};
            }
            if (!votesByCountry[toCountry][fromCountry]) {
                votesByCountry[toCountry][fromCountry] = 0;
            }
            votesByCountry[toCountry][fromCountry] += totalPoints; // Accumulate points
        }
    });

    // Load the GeoJSON file for the world map
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        .then(function(geoData) {
            const eurovisionData = geoData.features.filter(d =>
                eurovisionCountries.includes(d.properties.name)
            );

            // Draw the Eurovision countries
            // Draw the Eurovision countries
            svg.selectAll('path')
                .data(eurovisionData)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('class', 'country')
                .style('fill', '#69b3a2') // Default color
                .on('mouseover', function(event, d) {
                    // Only change the color if the country is not clicked
                    if (!d3.select(this).classed('clicked')) {
                        d3.select(this).style('fill', '#ff6347'); // Highlight on hover
                    }
                    tooltip.style('opacity', 1)
                        .html(`<strong>Country:</strong> ${d.properties.name}`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 20) + 'px');
                })
                .on('mousemove', function(event) {
                    tooltip.style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 20) + 'px');
                })
                .on('mouseout', function() {
                    // Revert to the original color only if the country is not clicked
                    if (!d3.select(this).classed('clicked')) {
                        d3.select(this).style('fill', '#69b3a2');
                    }
                    tooltip.style('opacity', 0);
                })
                .on('click', function(event, d) {
                    const clickedCountry = d.properties.name;

                    // Aggregate points from all countries to the clicked country
                    const voters = [];
                    if (votesByCountry[clickedCountry]) {
                        Object.entries(votesByCountry[clickedCountry]).forEach(([fromCountry, totalPoints]) => {
                            if (totalPoints > 100) {
                                voters.push(fromCountry);
                            }
                        });
                    }

                    // Reset all colors and remove the clicked class
                    d3.selectAll('.country')
                        .style('fill', '#69b3a2')
                        .classed('clicked', false);

                    // Highlight the clicked country
                    d3.select(this)
                        .style('fill', '#ff6347') // Highlight clicked country
                        .classed('clicked', true);

                    // Highlight countries that gave more than 100 points
                    svg.selectAll('.country')
                        .filter(function(d) {
                            return voters.includes(d.properties.name);
                        })
                        .style('fill', '#ff0000') // Highlight voters in red
                        .classed('clicked', true); // Mark voters as clicked
                });


        })
        .catch(function(error) {
            console.error('Error loading the GeoJSON data:', error);
        });
}).catch(function(error) {
    console.error('Error loading the votes.csv data:', error);
});


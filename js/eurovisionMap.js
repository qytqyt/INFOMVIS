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
    'ua': 'Ukraine'
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

// Load the GeoJSON file for the world map
d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
    .then(function(geoData) {
        // Filter out Australia separately so we can reposition it
        const australia = geoData.features.filter(d => d.properties.name === 'Australia')[0];

        // Remove Australia from the main country list
        const eurovisionData = geoData.features.filter(d =>
            eurovisionCountries.includes(d.properties.name) &&
            d.properties.name !== 'Australia'
        );

        // Draw the main Eurovision countries (excluding Australia)
        svg.selectAll('path')
            .data(eurovisionData)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'country')
            .on('mouseover', function(event, d) {
                d3.select(this).style('fill', '#ff6347'); // Change fill color on hover

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
                d3.select(this).style('fill', '#69b3a2'); // Reset the color
                tooltip.style('opacity', 0);
            })
            .on('click', function(event, d) {
                alert(`You clicked on ${d.properties.name}`);
            });

        // Position Australia next to Israel
        const australiaGroup = svg.append('g')
            .attr('transform', 'translate(700, 200)'); // Move Australia to the right of Israel

        // Draw Australia's path at the new position
        australiaGroup.append('path')
            .datum(australia)
            .attr('d', path)
            .attr('class', 'country')
            .style('fill', '#69b3a2')
            .on('mouseover', function(event, d) {
                d3.select(this).style('fill', '#ff6347');

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
                d3.select(this).style('fill', '#69b3a2');
                tooltip.style('opacity', 0);
            })
            .on('click', function(event, d) {
                alert(`You clicked on ${d.properties.name}`);
            });

    })
    .catch(function(error) {
        console.error('Error loading the GeoJSON data:', error);
    });

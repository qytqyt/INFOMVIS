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

    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
        .then(function(geoData) {
            const eurovisionData = geoData.features.filter(d =>
                eurovisionCountries.includes(d.properties.name)
            );

            function calculateColorIntensity(points, minPoints, maxPoints) {
                if (maxPoints === minPoints) {
                    return 75;
                }
                return 100 - ((points - minPoints) / (maxPoints - minPoints)) * 75;
            }

            // Update the click event
            svg.selectAll('path')
                .data(eurovisionData)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('class', 'country')
                .style('fill', '#69b3a2') // Default color
                .on('mouseover', function(event, d) {
                    const hoverData = d3.select('body').node()._hoverData || {};
                    const { clickedCountry, voters } = hoverData;

                    let votesInfo = '';
                    if (clickedCountry && votesByCountry[d.properties.name]) {
                        // Retrieve total points the hovered country (d.properties.name) gave to the clicked country
                        const totalVotes = votesByCountry[d.properties.name][clickedCountry] || 0;

                        if (totalVotes > 0) {
                            votesInfo = `<br><strong>Votes Given:</strong> ${totalVotes}`;
                        }
                    }

                    if (!d3.select(this).classed('clicked')) {
                        d3.select(this).style('fill', '#ff6347'); // Highlight on hover
                    }

                    tooltip.style('opacity', 1)
                        .html(`<strong>Country:</strong> ${d.properties.name}${votesInfo}`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 20) + 'px');
                })
                .on('mousemove', function(event) {
                    tooltip.style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 20) + 'px');
                })
                .on('mouseout', function() {
                    if (!d3.select(this).classed('clicked')) {
                        d3.select(this).style('fill', '#69b3a2');
                    }
                    tooltip.style('opacity', 0);
                })
                .on('click', function(event, d) {
                    const clickedCountry = d.properties.name;

                    const voters = [];
                    let maxPoints = 0;
                    let minPoints = Infinity;

                    if (votesByCountry[clickedCountry]) {
                        Object.entries(votesByCountry).forEach(([fromCountry, toCountryVotes]) => {
                            const totalPoints = toCountryVotes[clickedCountry] || 0;
                            if (totalPoints > 100) {
                                voters.push({ country: fromCountry, points: totalPoints });
                                maxPoints = Math.max(maxPoints, totalPoints);
                                minPoints = Math.min(minPoints, totalPoints);

                                console.log(fromCountry,totalPoints)
                            }
                        });
                    }

                    d3.select('body').node()._hoverData = { clickedCountry, voters, minPoints, maxPoints };

                    d3.selectAll('.country')
                        .style('fill', '#69b3a2')
                        .classed('clicked', false);

                    d3.select(this)
                        .style('fill', 'rgb(0, 0, 0)')
                        .classed('clicked', true);

                    svg.selectAll('.country')
                        .filter(function(d) {
                            const voter = voters.find(v => v.country === d.properties.name);
                            if (voter) {
                                const intensity = calculateColorIntensity(voter.points, minPoints, maxPoints);

                                const redValue = Math.round(255 - (intensity / 100) * 255); // Darker red for higher votes
                                const greenValue = Math.round((intensity / 100) * 50); // Adjust green for softer red
                                const colorValue = `rgb(${255 - redValue}, ${greenValue}, ${greenValue})`;

                                d3.select(this).style('fill', colorValue);
                                return true;
                            }
                            return false;
                        })
                        .classed('clicked', true);
                });


        })
        .catch(function(error) {
            console.error('Error loading the GeoJSON data:', error);
        });
}).catch(function(error) {
    console.error('Error loading the votes.csv data:', error);
});


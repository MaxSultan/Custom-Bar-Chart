const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

var parseDate = d3.timeParse("%Y-%m-%d");
const greaterThan = (x) => (y) => y > x;
const lessThan = (x) => (y) => y < x;
const capitalizeFirstLetter = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);
const formatDays = (date) => DAYS[date.getDay()];
const formatMonths = (monthIndex) => MONTHS[monthIndex];

const type = (d) => ({
  date: parseDate(d.date),
  // death: "",
  deathConfirmed: +d.deathConfirmed,
  deathIncrease: +d.deathIncrease,
  // deathProbable: "",
  // hospitalized: "",
  // hospitalizedCumulative: "",
  hospitalizedCurrently: +d.hospitalizedCurrently,
  hospitalizedIncrease: +d.hospitalizedIncrease,
  // inIcuCumulative: "",
  // inIcuCurrently: "",
  // negative: "",
  // negativeIncrease: "0",
  // negativeTestsAntibody: "",
  // negativeTestsPeopleAntibody: "",
  // negativeTestsViral: "",
  // onVentilatorCumulative: "",
  // onVentilatorCurrently: ""
  // positive: "2"
  // positiveCasesViral: ""
  positiveIncrease: +d.positiveIncrease,
  // positiveScore: "0"
  // positiveTestsAntibody: ""
  // positiveTestsAntigen: ""
  // positiveTestsPeopleAntibody: ""
  // positiveTestsPeopleAntigen: ""
  // positiveTestsViral: "0"
  // recovered: ""
  state: d.state,
  // totalTestEncountersViral: ""
  // totalTestEncountersViralIncrease: "0"
  // totalTestResults: "0"
  // totalTestResultsIncrease: "0"
  // totalTestsAntibody: ""
  // totalTestsAntigen: ""
  // totalTestsPeopleAntibody: ""
  // totalTestsPeopleAntigen: ""
  // totalTestsPeopleViral: ""
  // totalTestsPeopleViralIncrease: "0"
  // totalTestsViral: "0"
  // totalTestsViralIncrease: "0"
});

const ready = (data) => {
  const gaData = data[0];
  const utData = data[1];
  const metric = "positiveIncrease";
  const blue = "#1355FF";
  const green = "#57D3DD";
  let timePeriodSelection = "weekly";

  const filterData = (data) => {
    const oneWeek = ({ date }) => greaterThan(new Date("2021-02-29"))(date);
    const oneYear = ({ date }) => lessThan(new Date("2021-03-01"))(date);
    const sumByMonth = (list, value) => {
      const { date, state } = value;
      const monthIndex = date.getMonth();
      const objectIndex = list.findIndex(
        (object) => object.date === monthIndex && object.state === state
      );
      objectIndex > -1
        ? (list[objectIndex][metric] += value[metric])
        : list.push({ date: monthIndex, [metric]: value[metric], state });
      return list;
    };

    switch (timePeriodSelection) {
      case "weekly":
        return data.filter(oneWeek);
      case "monthly":
        return data.filter(oneYear).reduce(sumByMonth, []);
    }
  };

  // #region tooltip

  const tooltip = d3.select("#tooltip");

  const tooltipText = d3.select("#text").append("text");

  const tooltipValue = d3.select("#value").append("text");

  const capitalize = (word) => {
    return word.charAt(0).toUpperCase() + word.substring(1);
  };

  const toCapitalizedWords = (name) => {
    var words = name.match(/[A-Za-z][a-z]*/g) || [];

    return words.map(capitalize).join(" ");
  };

  const mouseenter = (event) => {
    const {
      currentTarget: { __data__: data },
    } = event;
    const { width, top, left } = event.currentTarget.getBoundingClientRect();

    tooltipValue.text(data[metric].toLocaleString("en-US"));
    tooltipText.text(toCapitalizedWords(metric));

    tooltip

      .style(
        "left",
        `${
          left +
          (width -
            document.getElementById("tooltip").getBoundingClientRect().width) /
            2
        }px`
      )
      .style(
        "top",
        `${
          top -
          document.getElementById("tooltip").getBoundingClientRect().height -
          5
        }px`
      )
      .transition()
      .duration(300)
      .style("opacity", "0.9");
  };

  const mouseleave = () => {
    tooltip.transition().duration(300).style("opacity", "0");
  };
  // #endregion tooltip

  const margin = { top: 120, left: 60, right: 60, bottom: 60 },
    height = 400 - margin.top - margin.bottom,
    width = 1000 - margin.left - margin.right;

  // create svg and group
  const svg = d3
    .select("#bar-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const svgGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // add title
  const title = svg
    .append("g")
    .attr("transform", `translate(${margin.left * 0.6}, ${margin.top - 50})`)
    .append("text")
    .attr("class", "title")
    .text("COVID Data");

  // #region legend
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(${(width + margin.left + margin.right) / 2}, ${62})`
    );

  const legendSectionOne = legend.append("g");
  const legendSectionTwo = legend
    .append("g")
    .attr("transform", "translate(150, 0)");

  legendSectionOne.append("circle").attr("r", 10).attr("fill", blue);
  legendSectionOne
    .append("text")
    .text("Value1")
    .attr("transform", "translate(20, 6)");

  legendSectionTwo.append("circle").attr("r", 10).attr("fill", green);
  legendSectionTwo
    .append("text")
    .text("Value2")
    .attr("transform", "translate(20, 6)");
  // #endregion legend

  // data aggregation
  data = [...gaData, ...utData];
  data = filterData(data);

  const yMax = d3.max(data, (d) => d[metric]);
  const yScale = d3
    .scaleLinear()
    .domain([0, yMax * 1.2])
    .range([height, 0]);
  const yAxis = d3.axisLeft().scale(yScale).tickSize(-width).ticks(5);

  const xDomain = data.map((data) => data.date);
  const xScale = d3
    .scaleBand()
    .domain(xDomain)
    .range([width, 0])
    .paddingInner(0.2)
    .paddingOuter(0.2);

  const selectCorrectFormat = (val) => {
    if (val === "weekly") return formatDays;
    if (val === "monthly") return formatMonths;
  };

  const xAxis = d3
    .axisBottom()
    .scale(xScale)
    .tickFormat(selectCorrectFormat(timePeriodSelection));

  const drawnYAxis = svgGroup.append("g").attr("class", "y-axis").call(yAxis);
  const drawnXAxis = svgGroup
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .attr("class", "x-axis")
    .call(xAxis);

  const calculateTopRoundedCornerClipPath = (d) => {
    const clipPathWidth =
      (xScale.bandwidth() - 2 * xScale.paddingInner() * xScale.bandwidth()) / 2;
    const arcHeight = 5;

    return d[metric] === 0
      ? null
      : `M${
          d.state === "GA"
            ? xScale(d.date)
            : xScale(d.date) +
              xScale.bandwidth() -
              2.4 * xScale.bandwidth() * xScale.paddingInner()
        },${height} v-${
          height - yScale(d[metric]) - arcHeight > 0
            ? height - yScale(d[metric]) - arcHeight
            : 0
        } a5,5 0 0 1 5,-5 h${clipPathWidth} a5,-5 0 0 1 5,5 v${
          height - yScale(d[metric]) - arcHeight > 0
            ? height - yScale(d[metric]) - arcHeight
            : 0
        } z`;
  };

  const bars = svgGroup
    .selectAll(".bars")
    .data(data)
    .join(
      (enter) =>
        enter
          // have to use clipPath instead of rect to get 2 rounded corners
          .append("path")
          .attr("class", "bars")
          .attr("d", calculateTopRoundedCornerClipPath)
          .attr("fill", (d) => (d.state === "GA" ? blue : green))
          .on("mouseenter", mouseenter)
          .on("mouseleave", mouseleave),
      (update) =>
        update
          .transition()
          .duration(100)
          .attr("d", calculateTopRoundedCornerClipPath),
      (exit) => exit.remove()
    );
  // #region select

  const optionData = [
    "weekly",
    "monthly",
    //   "yearly"
  ];

  const updateBarChart = async (data) => {
    // have to use this to remove bars because of clip path thing
    d3.selectAll("svg > g > .bars").remove();
    xScale.domain(data.map((data) => data.date));
    yScale.domain([0, d3.max(data, (d) => d[metric]) * 1.2]);

    drawnXAxis
      .transition()
      .duration(1000)
      .call(
        xAxis.scale(xScale).tickFormat(selectCorrectFormat(timePeriodSelection))
      );
    drawnYAxis.transition().duration(1000).call(yAxis.scale(yScale));

    const bars = svgGroup
      .selectAll(".bars")
      .data(data)
      .join(
        (enter) =>
          enter
            // have to use clipPath instead of rect to get 2 rounded corners
            .append("path")
            .attr("class", "bars")
            .attr("d", calculateTopRoundedCornerClipPath)
            .attr("fill", (d) => (d.state === "GA" ? blue : green))
            .on("mouseenter", mouseenter)
            .on("mouseleave", mouseleave),
        (update) =>
          update
            .transition()
            .duration(100)
            .attr("d", calculateTopRoundedCornerClipPath),
        (exit) => exit.remove()
      );
  };

  const selectChange = (event) => {
    timePeriodSelection = event.target.value;
    updateBarChart(filterData([...gaData, ...utData]));
  };
  const select = svg
    .append("g")
    .attr("transform", "translate(850, 45)")
    .append("foreignObject")
    .attr("width", 100)
    .attr("height", 50)
    .append("xhtml:select")
    .attr("id", "bar-chart-select")
    .on("change", selectChange);

  const options = select
    .selectAll("option")
    .data(optionData)
    .enter()
    .append("xhtml:option");

  options.text(capitalizeFirstLetter).attr("value", (d) => d);
  // #endregion select
};

const gaDataPath = "./data/georgia-history.csv";
const utDataPath = "./data/utah-history.csv";
const gaData = d3.csv(gaDataPath, type);
const utData = d3.csv(utDataPath, type);
Promise.all([gaData, utData]).then(ready);

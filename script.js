// 1) Get what user inputs => Bus Route 
// 2) Validation - check user input / Regular Express (RegEx) - OPTIONAL
// 3) If user input OK => fetch bus routes => check if bus route exists 
// 4) If exists => inbound / outbound routes => create route button for users
// 5) When route button is being clicked => fetch exact route
// 6) Map each bus top name with the stop ID
// 7) Append the data into the HTML

// SQL Injection <<< Hacking
// Please input your User ID: "jack OR 1=1" <<<< no space // no special characters
// MySQL Database <<< SELECT * from user where user_id = jack OR 1=1

const routeAPI = 'https://data.etabus.gov.hk/v1/transport/kmb/route/'; // show all bus routes
const routeStopAPI = 'https://data.etabus.gov.hk/v1/transport/kmb/route-stop';
const stopAPI = 'https://data.etabus.gov.hk/v1/transport/kmb/stop';

document.addEventListener('DOMContentLoaded', function () {
    const submitBtn = document.getElementById('submitBtn');

    submitBtn.addEventListener('click', async function () {
        // Clear HTML Container - RESET
        const boundContainer = document.getElementById('bound');
        boundContainer.innerHTML = '';
        const routeContainer = document.getElementById('route-container');
        routeContainer.innerHTML = '';
        hideError();

        // Get user inputs
        const userInput = document.getElementById('userInput');
        const busRoute = userInput.value.trim().replaceAll(' ', '').toUpperCase(); // user's selected route
        userInput.value = busRoute; // polish the user input

        const regex = new RegExp(/^[a-zA-Z0-9]*$/);
        if (regex.test(busRoute)) {
            try {
                const routes = await checkRouteExist(busRoute); // promise
                boundContainer.textContent = '請選擇路線：';
                routes.forEach(route => {
                    const boundBtn = createBoundBtn(route);
                    boundContainer.appendChild(boundBtn);
                });
            } catch (err) {
                console.log(err);
                showError(err);
            }
        } else {
            showError(`請輸入正確巴士路線！`);
        }
    });
});

async function checkRouteExist(input) {
    // Implicitly Promise
    const res = await fetch(routeAPI);
    const results = await res.json();
    // results => All routes in KMB
    if (results) { // Just to make sure there is data
        const busRoutes = [];
        for (let i = 0; i < results['data'].length; i++) {
            const eachRoute = results['data'][i];
            if (eachRoute.route == input) {
                busRoutes.push(eachRoute);
            }
        }
        if (busRoutes.length > 0) {
            // The route exists
            return (busRoutes); // Promise.resolve(busRoutes);
        } else {
            // No such route
            return Promise.reject('無呢條線喎！');
        }
    } else {
        return Promise.reject('喂 Sorry，佢嗰嘢壞咗！');
    }
}

function createBoundBtn(route) {
    const boundBtn = document.createElement('button');
    boundBtn.textContent = `${route.orig_tc} ➡️ ${route.dest_tc}`;

    boundBtn.setAttribute('data-bound', route.bound == "O" ? 'outbound' : 'inbound');
    boundBtn.setAttribute('data-route', route.route);
    boundBtn.setAttribute('data-type', route.service_type);

    boundBtn.addEventListener('click', async function () {
        const routeContainer = document.getElementById('route-container');
        routeContainer.innerHTML = '';
        showLoading();
        const routeNum = this.getAttribute('data-route');
        const routeBound = this.getAttribute('data-bound');
        const routeType = this.getAttribute('data-type');

        const res = await fetch(`${routeStopAPI}/${routeNum}/${routeBound}/${routeType}`);
        const routeData = await res.json();
        await renderRouteList(routeData.data);
    });

    return boundBtn;
}

async function renderRouteList(routeDataArr) {
    const routeContainer = document.getElementById('route-container');
    const routeList = document.createElement('ul');

    for (let i = 0; i < routeDataArr.length; i++) {
        const stopId = routeDataArr[i].stop;
        const res = await fetch(`${stopAPI}/${stopId}`);
        const results = await res.json();
        const stopName = results.data.name_tc;
        const li = document.createElement('li');
        li.textContent = `#${routeDataArr[i].seq} - ${stopName}`;
        routeList.appendChild(li);
    }
    hideLoading();
    routeContainer.appendChild(routeList);
}

function showLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
}

function showError(err) {
    const error = document.getElementById('error');
    error.textContent = err;
    error.style.display = 'block';
}

function hideError() {
    const error = document.getElementById('error');
    error.textContent = '';
    error.style.display = 'none';
}
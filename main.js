function loadScreener(data, timeInterval) {
    const swiperWrapper = document.querySelectorAll(".swiper-wrapper")[0];
    swiperWrapper.innerHTML = ""; // clear previous slides

    const getStarred = () => JSON.parse(localStorage.getItem('starredItems') || '[]');
    const saveStarred = (items) => localStorage.setItem('starredItems', JSON.stringify(items));

    document.querySelectorAll(".time-interval").forEach(el => {
        el.innerHTML = capitalizeFirstLetter(timeInterval);
    });

    Object.entries(data).forEach(([key, val]) => {
        const statusList = val[timeInterval]?.status || [];
        if (statusList.length > 0) {
            statusList.forEach(status => {
                const slide = document.createElement("div");
                slide.className = "swiper-slide";
                slide.innerHTML = `
                <div class="status">
                    <div class="status-type">${status}</div>
                    <div class="status-crypto">${val.name}</div>
                </div>
            `;
                const graph = document.createElement("div");
                graph.className = "line-graph";
                drawLineGraph(graph, val[timeInterval].candles, 284, 105);
                slide.appendChild(graph);
                swiperWrapper.appendChild(slide);
            });
        }
    });

    new Swiper(".swiper-status", {
        slidesPerView: "auto",
        spaceBetween: 8,
        loop: false,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        on: {
            init: function() {
                updateButtons(this);
            },
            slideChange: function() {
                updateButtons(this);
            },
            resize: function() {
                updateButtons(this);
            }
        }
    });

    new Swiper(".swiper-options", {
        slidesPerView: "auto",
        spaceBetween: 8,
        loop: false,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        on: {
            init: function() {
                updateButtons(this);
            },
            slideChange: function() {
                updateButtons(this);
            },
            resize: function() {
                updateButtons(this);
            }
        }

    });

    const tableData = Object.entries(data).map(([key, val], index) => [
        `<i class="bi bi-star" data-key="${key}"></i>`,
        `
        <div class="crypto-cell">
            <img src="./icons/${key.toLowerCase()}.svg" alt="${key}"
                onerror="this.onerror=null; this.src='./icons/error.svg';" class="screener-icon"/>
            <div class="crypto-name-wrapper">
                <span class="crypto-name">${val.name}</span>
                <span class="crypto-symbol">${key}</span>
            </div>
        </div>
        `,
        `$${addCommas(smartRound(val.price))}`,
        formatChange(val[timeInterval].change),
        `${val[timeInterval].dominance.toFixed(2)}%`,
        val[timeInterval].volatility.toFixed(2),
        `<span style="display: none">${val[timeInterval].correlation - 1e-10}</span>${val[timeInterval].correlation.toFixed(2)}`,
        `${val[timeInterval].trend.toFixed(2)}%`,
        `${interpretSignalsColored(val[timeInterval].indicators)}`,
        `$${addCommas(smartRound(val[timeInterval].low))}`,
        `<div class="range-bar" 
            data-price="${val.price}" 
            data-low="${val[timeInterval].low}" 
            data-high="${val[timeInterval].high}">
            <div class="red"></div>
            <div class="green"></div>
            <div class="marker"></div>
        </div>`,
        `$${addCommas(smartRound(val[timeInterval].high))}`,
        `${(val[timeInterval].velocity * 100).toFixed(2)}`,
        `${(val[timeInterval].rsi).toFixed(2)}`,
        `<div class="mini-graph" id="graph-${index}"></div>`
    ]);

    $('#table1').DataTable({
        data: tableData,
        lengthMenu: [
            [20, 30, 50, 'All']
        ],
        lengthChange: false,
        scrollX: true,
        order: [
            [4, 'desc']
        ],
        fixedColumns: {
            leftColumns: 2
        },
        language: {
            search: "<i class='bi bi-search'></i>&nbsp;",
            info: "", //"Showing _START_ to _END_ of _TOTAL_ Cryptocurrencies",
            infoFiltered: ""
        },
        columnDefs: [{
                targets: [0, 1, 11],
                className: 'dt-left-cell'
            }, // left-align columns 0,1,11
            {
                targets: [5, 6, 7, 12, 13],
                visible: false
            }, // hide some
            {
                targets: Array.from({
                    length: 14
                }, (_, i) => i).filter(i => ![0, 1, 11].includes(i)),
                className: 'dt-right-cell' // right-align everything else
            },
            {
                targets: 11,
                type: 'string'
            },
            {
                targets: [0, 9, 10, 11, 14], // column indexes where you don’t want sorting
                orderable: false // disable ordering
            }
        ],


        initComplete() {
            renderMiniGraphs(data, timeInterval);
        },
        drawCallback() {
            this.api().columns.adjust();
            renderMiniGraphs(data, timeInterval);
            initRangeBars();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            const starredItems = getStarred();
            this.api().rows().every(function() {
                const $cell = $(this.node()).find('i[data-key]');
                const key = $cell.attr('data-key');
                if (starredItems.includes(key)) {
                    $cell.removeClass('bi-star').addClass('bi-star-fill star-yellow');
                }
            });
        }
    });

    $('#table1').on('click', 'i[data-key]', function() {
        const key = $(this).data('key');
        let starredItems = getStarred();

        if (starredItems.includes(key)) {
            // already starred → unstar
            starredItems = starredItems.filter(k => k !== key);
            $(this).removeClass('bi-star-fill star-yellow').addClass('bi-star');
        } else {
            // not starred → star
            starredItems.push(key);
            $(this).removeClass('bi-star').addClass('bi-star-fill star-yellow');
        }

        saveStarred(starredItems);
    });

    const savedMode = localStorage.getItem("selectedMode") || "Default";
    loadMode(savedMode);

    loadSavedScreener();

    initRangeBars();

    try {
        document.getElementById("time").innerHTML = formatTimestamp(data["BTC"]["time"]);
    } catch {
        console.log("Time error")
    }
}
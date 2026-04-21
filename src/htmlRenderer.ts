export function renderHtml(params: {
    af4graph: string;
    exhibit: string;
    fileKey: string;
}): string {
    const { af4graph, exhibit, fileKey } = params;
    const exhibitHidden = exhibit === '[Not provided]';
    const exhibitStyle = exhibitHidden ? ' style="display: none;"' : '';

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ArgBlazer Report</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css" rel="stylesheet" />
        <style>
            body{margin:0;padding:10px 20px 0 20px;font-family:'JetBrains Mono',monospace;background:#fff;color:#333;height:100vh;min-width:402px;min-height:540px;box-sizing:border-box;display:flex;flex-direction:column}
            body::after{content:'';height:10px;flex-shrink:0}
            .token.operator{background:transparent!important}
            pre[class*="language-"],code[class*="language-"]{background:#f8f9fa!important}
            .line-numbers .line-numbers-rows{border-right-color:#e0e0e0!important}
            .exhibit-section,.decisions-section,.extensions-section{padding:0;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,.05);display:flex;flex-direction:column;min-height:0}
            .decision-item{display:flex;align-items:baseline;padding:1px 0;font-size:13px;column-gap:6px;row-gap:1px;flex-wrap:wrap;border-bottom:1px solid #ebebeb}
            .decision-item:last-child{border-bottom:none}
            .decision-question{color:#555}
            .decision-answer{font-weight:600}
            .decision-answer.yes{color:#28a745}
            .decision-answer.no{color:#dc3545}
            .decision-value{text-decoration:underline}
            .resize-handle{height:10px;background:transparent;cursor:row-resize;display:flex;align-items:center;justify-content:center;position:relative;z-index:1000;margin:5px 0}
            .resize-handle::before{content:'';width:80px;height:3px;background:#dee2e6;border-radius:2px;transition:all 0.2s ease}
            .resize-handle:hover::before{background:#28a745;width:120px;height:4px;box-shadow:0 2px 8px rgba(40, 167, 69, 0.3)}
            .resize-handle:active::before{background:#1e7e34}
            .section-header{display:flex;justify-content:space-between;align-items:center;padding:5px;cursor:pointer;user-select:none;border-bottom:1px solid #e0e0e0;flex-shrink:0;flex-wrap:wrap;gap:8px}
            .main-content > .section-header{cursor:default;margin-bottom:0;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px 8px 0 0;box-shadow:0 2px 4px rgba(0,0,0,.05);border-bottom:1px solid #e0e0e0;flex-wrap:nowrap;align-items:flex-start}
            .section-header h3{margin:0;font-size:16px;font-weight:600;color:#333}
            .section-toggle{font-size:14px;color:#666;transition:transform 0.2s ease}
            .section-toggle.collapsed{transform:rotate(-90deg)}
            .section-content{padding:16px;overflow-y:auto;transition:max-height 0.3s ease;flex:1;min-height:0}
            #decisions-content{flex:1 1 0;padding-top:6px;padding-bottom:6px;overflow-y:auto}
            #exhibit-content{padding:0}
            #exhibit-content pre{margin:0;padding:8px 16px 8px 48px!important}
            .section-content.collapsed{max-height:0!important;padding-top:0!important;padding-bottom:0!important;overflow:hidden}
            .section-header:has(+ .section-content.collapsed){border-bottom:none}
            .header-controls{display:flex;align-items:center;gap:16px;flex-wrap:wrap;min-width:0;justify-content:flex-end;flex:1 1 auto}
            .step-navigation{display:flex;align-items:center;gap:8px;flex-shrink:0}
            .nav-btn{padding:4px 8px;font-size:14px;font-weight:500;font-family:'JetBrains Mono',monospace;background:#f0f0f0;border:1px solid #d0d0d0;border-radius:4px;cursor:pointer;transition:all .2s}
            .nav-btn:hover:not(:disabled){background:#e0e0e0;border-color:#bbb}
            .nav-btn:disabled{background:#f8f8f8;border-color:#e0e0e0;color:#ccc;cursor:not-allowed}
            #step-indicator{font-size:14px;font-weight:500;color:#555;min-width:60px;text-align:center}
            .display-controls{display:flex;align-items:center;gap:8px;flex-shrink:0;flex-wrap:nowrap;min-width:0}
            .set-dropdown-wrap{position:relative}
            .set-dropdown-btn{padding:4px 8px;min-width:80px;max-width:180px;font-size:12px;font-family:'JetBrains Mono',monospace;background:#f8f9fa;border:1px solid #d0d0d0;border-radius:4px;cursor:pointer;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .set-dropdown-btn:hover{background:#f0f0f0;border-color:#bbb}
            .set-dropdown-btn::after{content:'\\25BE';float:right;margin-left:6px;color:#888}
            .set-dropdown-list{display:none;position:absolute;top:100%;right:0;margin-top:2px;background:#fff;border:1px solid #d0d0d0;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.12);z-index:2000;min-width:140px;max-height:200px;overflow-y:auto}
            .set-dropdown-list.open{display:block}
            .set-dropdown-item{display:flex;align-items:center;gap:6px;padding:4px 10px;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;user-select:none;white-space:nowrap}
            .set-dropdown-item:hover{background:#f0f0f0}
            .set-dropdown-item input{margin:0;cursor:pointer}
            .set-dropdown-item.disabled{color:#bbb;cursor:default;pointer-events:none}
            .set-dropdown-item.disabled input{cursor:default}
            .set-dropdown-sep{border:none;border-top:1px solid #e0e0e0;margin:2px 0}
            .set-dropdown-action{display:flex;align-items:center;gap:6px;padding:4px 10px;font-size:12px;font-family:'JetBrains Mono',monospace;cursor:pointer;user-select:none}
            .set-dropdown-action:hover{background:#f0f0f0}
            .set-dropdown-action.disabled{color:#bbb;cursor:default;pointer-events:none}
            .display-dropdown{padding:4px 8px;min-width:80px;max-width:100%;font-size:12px;font-family:'JetBrains Mono',monospace;background:#f8f9fa;border:1px solid #d0d0d0;border-radius:4px;cursor:pointer}
            .display-dropdown:hover{background:#f0f0f0;border-color:#bbb}
            .display-dropdown:focus{outline:none;border-color:#999;box-shadow:0 0 3px rgba(0,0,0,.1)}
            .main-content{display:flex;flex-direction:column;min-height:0}
            #graph-container{width:calc(100% - 2px);margin-left:0;margin-right:0;flex:1;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;background:#f8f9fa;box-shadow:0 2px 4px rgba(0,0,0,.05);position:relative}
            .zoom-controls{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:4px;z-index:1000}
            .zoom-btn{width:32px;height:32px;padding:0;font-size:16px;font-weight:600;font-family:'JetBrains Mono',monospace;background:#fff;border:1px solid #d0d0d0;border-radius:4px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,.1)}
            .zoom-btn:hover{background:#f0f0f0;border-color:#bbb;box-shadow:0 3px 6px rgba(0,0,0,.15)}
            .zoom-btn:active{background:#e0e0e0;border-color:#999;transform:translateY(1px)}
            .zoom-btn:disabled{background:#f8f8f8;border-color:#e0e0e0;color:#ccc;cursor:not-allowed;box-shadow:0 1px 2px rgba(0,0,0,.05)}
            .zoom-btn:disabled:hover{background:#f8f8f8;border-color:#e0e0e0;transform:none}
            .diagram-wrapper{display:flex;justify-content:center;align-items:center;height:100%;transform-origin: center;font-size:16px;color:#666}
            .error{color:#555;text-align:center;padding:20px}
            .extensions-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
            .toggle-buttons{display:flex;gap:8px;margin-left:auto}
            .toggle-btn,.extension-set{padding:4px 5px;font-size:12px;font-weight:500;font-family:'JetBrains Mono',monospace;border-radius:4px;cursor:pointer;transition:all .2s}
            .toggle-btn{background:#d0d0d0;border:1px solid #aaa}
            .toggle-btn:hover{background:#c0c0c0;border-color:#999}
            .toggle-btn.active{background:#f0f0f0;border-color:#ddd;color:#777}
            .extensions-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
            .extension-item{display:flex;align-items:flex-start;padding:6px 0;font-size:13px}
            .extension-label{font-weight:600;color:#555;min-width:100px;margin-right:8px;flex-shrink:0}
            .extension-values{color:#555;flex:1;display:flex;flex-wrap:wrap;gap:8px}
            .extension-set{border:1px solid #d0d0d0;background:#f0f0f0;box-shadow:0 1px 2px rgba(0,0,0,.1);max-width:100%;word-break:break-word;white-space:normal}
            .extension-set:hover,.extension-set.selected{background:var(--extension-hover-bg);border-color:var(--extension-hover-border);color:var(--extension-hover-text);box-shadow:0 2px 4px rgba(0,0,0,.15)}
            .extension-set.selected{font-weight:600}
            g.select foreignObject hr,g.selectadd foreignObject hr{border-top-color:white!important}
            @media(max-width:600px){
                body{padding:10px 10px 0 10px}
                .header-controls{flex-direction:column;align-items:flex-start;gap:8px;width:100%}
                .step-navigation{align-self:flex-end;justify-content:flex-end}
                .display-controls{align-self:flex-end;justify-content:flex-end}
                .extensions-grid{grid-template-columns:1fr}
                #graph-container{min-height:150px}
            }
            @media(max-width:480px){
                .nav-btn{padding:2px 6px;font-size:12px}
                .display-dropdown{min-width:70px;font-size:11px}
                #step-indicator{min-width:50px;font-size:12px}
            }
            @media print{
                .exhibit-section,.decisions-section,.extensions-section,.main-content>.section-header,#graph-container{background:none!important;box-shadow:none!important}
                .zoom-btn{box-shadow:none!important}
                .extension-set{background:none!important;box-shadow:none!important}
                .extension-set.selected{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:var(--extension-hover-bg)!important;border-color:var(--extension-hover-border)!important;color:var(--extension-hover-text)!important}
                g.select *,g.selectadd *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
                g.select foreignObject *,g.selectadd foreignObject *{color:white!important}
                g.select foreignObject hr,g.selectadd foreignObject hr{border-top-color:white!important}
            }
        </style>
    </head>
<body>
    <div class="exhibit-section" id="exhibit-section"${exhibitStyle}>
        <div class="section-header" onclick="toggleSection('exhibit')">
            <h3>Exhibit</h3>
            <span class="section-toggle" id="exhibit-toggle"><span style="font-family: Arial;">&#9660;</span></span>
        </div>
        <div class="section-content" id="exhibit-content">
            <pre class="line-numbers"><code class="language-python">${exhibit}</code></pre>
        </div>
    </div>

    <div class="resize-handle" id="resize-handle-0" style="display: none;"></div>

    <div class="decisions-section" id="decisions-section" style="display: none;">
        <div class="section-header" onclick="toggleSection('decisions')">
            <h3>Decisions</h3>
            <span class="section-toggle" id="decisions-toggle"><span style="font-family: Arial;">&#9660;</span></span>
        </div>
        <div class="section-content" id="decisions-content">
            <div id="decisions-list"></div>
        </div>
    </div>

    <div class="resize-handle" id="resize-handle-1"></div>

    <div class="main-content" id="graph-section">
        <div class="section-header">
            <h3>Graph</h3>
            <div class="header-controls">
                <div class="display-controls">
                    <label for="theme-selector">Theme:</label>
                    <select id="theme-selector" class="display-dropdown">
                        <option value="green" selected>Green</option>
                        <option value="xray">XRAY</option>
                    </select>
                </div>
                <div class="display-controls">
                    <label for="rank-direction">Rank from:</label>
                    <select id="rank-direction" class="display-dropdown">
                        <option value="top" selected>Top</option>
                        <option value="bottom">Bottom</option>
                    </select>
                </div>
                <div class="step-navigation">
                    <button id="start-step" class="nav-btn">&#448;&lt;</button>
                    <button id="prev-step" class="nav-btn" disabled>&lt;</button>
                    <span id="step-indicator">Step 1</span>
                    <button id="next-step" class="nav-btn">&gt;</button>
                    <button id="end-step" class="nav-btn">&gt;&#448;</button>
                </div>
                <div class="display-controls">
                    <label for="argument-display-mode">Display:</label>
                    <select id="argument-display-mode" class="display-dropdown">
                        <option value="label">Label</option>
                        <option value="label-summary" selected>Summary</option>
                        <option value="label-summary-details">Details</option>
                    </select>
                </div>
                <div class="display-controls" id="set-filter-controls" style="display:none;">
                    <label>Sets:</label>
                    <div class="set-dropdown-wrap" id="set-dropdown-wrap">
                        <button type="button" class="set-dropdown-btn" id="set-dropdown-btn"></button>
                        <div class="set-dropdown-list" id="set-dropdown-list"></div>
                    </div>
                </div>
            </div>
        </div>
        <div id="graph-container">
            <div class="zoom-controls">
                <button id="zoom-in-btn" class="zoom-btn" title="Zoom In">+</button>
                <button id="zoom-out-btn" class="zoom-btn" title="Zoom Out">-</button>
                <button id="zoom-fit-btn" class="zoom-btn" title="Fit to Screen">&#x26F6</button>
            </div>
            <div class="diagram-wrapper", id="wrapper">
                <div id="mermaid-diagram"></div>
            </div>
        </div>
    </div>

    <div class="resize-handle" id="resize-handle-2"></div>

    <div class="extensions-section" id="extensions-section">
        <div class="section-header" onclick="toggleSection('extensions')">
            <h3>Extensions</h3>
            <span class="section-toggle" id="extensions-toggle"><span style="font-family: Arial;">&#9660;</span></span>
        </div>
        <div class="section-content" id="extensions-content">
            <div class="extensions-header">
                <div class="toggle-buttons">
                    <button id="toggle-show-all" class="toggle-btn active">Show All</button>
                    <button id="toggle-conflict-free" class="toggle-btn active">Show Conflict-free</button>
                    <button id="toggle-admissible" class="toggle-btn active">Show Admissible</button>
                </div>
            </div>
            <div class="extensions-grid" id="extensions-grid">
            </div>
        </div>
    </div>
</body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.9.0/mermaid.min.js"></script>
<script src="https://unpkg.com/@panzoom/panzoom@4.6.0/dist/panzoom.min.js"></script>
<script>
    const argumentationData = ${af4graph};
    const fileKey = '${fileKey}';
    let panzoomInstance = null;
    let savedZoomLevel = null;
    let currentStepIndex = 0;
    var showAllActive = false;
    let maxStepIndex = 0;
    let actualSteps = [];
    let currentSetFilter = [];
    let nodeData, colors;
    ${getScriptFuncs()}
    </script>
</html>`;
}

function getScriptFuncs(): string {
    // Client-side JavaScript — returned as a string to embed in the HTML.
    // Uses escaped template literals where the original code used backticks.
    return `
    function updateResizeHandleVisibility(){
        var exhibitHidden = window.getComputedStyle(exhibitSection).display === 'none';
        var decisionsHidden = window.getComputedStyle(decisionsSection).display === 'none';
        handle0.style.display = (!exhibitHidden && !decisionsHidden) ? 'flex' : 'none';
        handle1.style.display = (exhibitHidden && decisionsHidden) ? 'none' : 'flex';
    }

    function getFitScale(container, elem) {
        var containerWidth = container.clientWidth;
        var containerHeight = container.clientHeight;
        var elemWidth = elem.clientWidth;
        var elemHeight = elem.clientHeight;
        return Math.min(containerWidth / elemWidth, containerHeight / elemHeight);
    }

    function initializeSteps() {
        var stepSet = new Set();
        if (argumentationData.arguments) {
            Object.values(argumentationData.arguments).forEach(function(argData) {
                stepSet.add(argData.step);
            });
        }

        actualSteps = Array.from(stepSet).sort(function(a, b) { return a - b; });
        maxStepIndex = actualSteps.length - 1;

        var stored = getFileSpecificStorage('sessionCurrentStepValue', 'End');
        var preservedStepValue = stored === 'End' ? 'End' : parseInt(stored, 10);

        if (preservedStepValue === 'End' || preservedStepValue == null) {
            currentStepIndex = maxStepIndex + 1;
        } else {
            currentStepIndex = actualSteps.indexOf(preservedStepValue);
            if (currentStepIndex === -1) {
                var nextStep = actualSteps.find(function(step) { return step > preservedStepValue; });
                currentStepIndex = nextStep !== undefined ? actualSteps.indexOf(nextStep) : maxStepIndex + 1;
            }
        }

        updateStepIndicator();
    }

    function toArgArray() {
        return Object.keys(argumentationData.arguments).map(function(k) {
            var o = {}; o[k] = argumentationData.arguments[k]; return o;
        });
    }

    function normalizeSets(sets) {
        return Array.isArray(sets) ? sets : [sets];
    }

    function collectAllSets() {
        var setObj = {};
        if (!argumentationData.arguments) return [];
        Object.values(argumentationData.arguments).forEach(function(argData) {
            if (argData && argData.sets !== undefined) {
                normalizeSets(argData.sets).forEach(function(t) { setObj[t] = true; });
            }
        });
        return Object.keys(setObj).sort();
    }

    function getArgumentSets(arg) {
        var argData = Object.values(arg)[0];
        var sets = new Set();
        if (argData && argData.sets !== undefined) {
            normalizeSets(argData.sets).forEach(function(v) { sets.add(v); });
        }
        return sets;
    }

    function hasAnySets(arg) {
        return getArgumentSets(arg).size > 0;
    }

    ${getExtensionFuncs()}

    function getFilteredArguments(stepIndex) {
        if (!argumentationData.arguments) return [];

        var allArgs = toArgArray();

        var filtered;
        if (stepIndex > maxStepIndex) {
            filtered = allArgs;
        } else {
            var currentActualStep = actualSteps[stepIndex];
            filtered = allArgs.filter(function(arg) {
                return Object.values(arg)[0].step <= currentActualStep;
            });
        }

        var setControlsVisible = document.getElementById('set-filter-controls') && document.getElementById('set-filter-controls').style.display !== 'none';
        if (setControlsVisible) {
            filtered = filtered.filter(function(arg) {
                if (currentSetFilter.length === 0) return false;
                var argSets = getArgumentSets(arg);
                if (argSets.size === 0) {
                    return currentSetFilter.indexOf('__unassigned__') !== -1;
                }
                return currentSetFilter.some(function(t) {
                    return t !== '__unassigned__' && argSets.has(t);
                });
            });
        }

        return filtered;
    }

    function getNewArgumentsForStep(stepIndex) {
        if (!argumentationData.arguments) return [];

        if (stepIndex > maxStepIndex) {
            return [];
        }

        var currentActualStep = actualSteps[stepIndex];

        return toArgArray().filter(function(arg) {
            return Object.values(arg)[0].step === currentActualStep;
        });
    }

    function getFilteredAttacks(stepIndex) {
        if (!argumentationData.attacks) return [];

        var visibleArgIds = new Set();
        getFilteredArguments(stepIndex).forEach(function(arg) {
            visibleArgIds.add(Object.keys(arg)[0]);
        });

        return argumentationData.attacks.filter(function(attack) {
            return visibleArgIds.has(attack[0]) && visibleArgIds.has(attack[1]);
        });
    }

    function generateSubgraphs(stepIndex) {
        var rankDirection = getFileSpecificStorage('sessionRankDirection', document.getElementById('rank-direction').value);
        document.getElementById('rank-direction').value = rankDirection;
        var effectiveStepIndex = Math.max(0, Math.min(stepIndex, maxStepIndex));
        var rankArr = argumentationData.steps ? (rankDirection === 'top' ? argumentationData.steps.rank_top : argumentationData.steps.rank_bottom) : null;
        var rankData = rankArr ? rankArr[effectiveStepIndex] : null;
        if (!rankData) return '';

        var filteredArguments = getFilteredArguments(stepIndex);
        var visibleArgIds = new Set(filteredArguments.map(function(arg) { return Object.keys(arg)[0]; }));

        var rankGroups = {};
        Object.entries(rankData).forEach(function(entry) {
            var argId = entry[0], rank = entry[1];
            if (visibleArgIds.has(argId)) {
                if (!rankGroups[rank]) {
                    rankGroups[rank] = [];
                }
                rankGroups[rank].push(argId);
            }
        });

        var sortedRanks = Object.keys(rankGroups).map(Number).sort(function(a, b) {
            return rankDirection === 'top' ? b - a : a - b;
        });

        var subgraphString = '';
        var subgraphIds = [];

        sortedRanks.forEach(function(rank) {
            var rankLabel = rank + 1;
            var subgraphId = 'r' + rankLabel;
            subgraphIds.push(subgraphId);
            subgraphString += '  subgraph ' + subgraphId + '[Rank ' + rankLabel + ']\\n';
            rankGroups[rank].forEach(function(argId) {
                subgraphString += '    ' + argId + '\\n';
            });
            subgraphString += '  end\\n';
        });

        if (subgraphIds.length > 0) {
            subgraphString += '  classDef ghost fill:transparent,stroke:none,color:transparent;\\n';
            subgraphString += '  class ' + subgraphIds.join(',') + ' ghost\\n';
        }

        return subgraphString;
    }

    function updateStepIndicator() {
        if (currentStepIndex <= maxStepIndex && currentStepIndex >= 0) {
            var actualStep = actualSteps[currentStepIndex];
            setFileSpecificStorage('sessionCurrentStepValue', actualStep.toString());
            document.getElementById('step-indicator').textContent = 'Step ' + actualStep;
        } else {
            setFileSpecificStorage('sessionCurrentStepValue', 'End');
            document.getElementById('step-indicator').textContent = 'End';
        }

        if (extensionsSection) {
            extensionsSection.style.display = 'flex';
        }

        document.getElementById('prev-step').disabled = currentStepIndex <= 0;
        document.getElementById('next-step').disabled = currentStepIndex > maxStepIndex;
        document.getElementById('start-step').disabled = currentStepIndex <= 0;
        document.getElementById('end-step').disabled = currentStepIndex > maxStepIndex;

        updateExtensionsDisplay();
        updateDecisionsDisplay();
    }

    function setupStepNavigation() {
        document.getElementById('prev-step').addEventListener('click', function() {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                updateStepIndicator();
                updateGraph('StepNavigation');
                resetExtensionSelection();
            }
        });

        document.getElementById('next-step').addEventListener('click', function() {
            if (currentStepIndex <= maxStepIndex) {
                currentStepIndex++;
                updateStepIndicator();
                updateGraph('StepNavigation');
                resetExtensionSelection();
            }
        });

        document.getElementById('start-step').addEventListener('click', function() {
            if (currentStepIndex > 0) {
                currentStepIndex = 0;
                updateStepIndicator();
                updateGraph('StepNavigation');
                resetExtensionSelection();
            }
        });

        document.getElementById('end-step').addEventListener('click', function() {
            if (currentStepIndex <= maxStepIndex) {
                currentStepIndex = maxStepIndex + 1;
                updateStepIndicator();
                updateGraph('StepNavigation');
                resetExtensionSelection();
            }
        });
    }

    function formatMultiLineLabel(key, argData, displayMode) {
        displayMode = displayMode || 'label-summary';
        var separator = "<hr style='border:0;border-top:1px dashed;margin:0;'/>";
        if (displayMode === 'label' || typeof argData === 'string') {
            return "<div style='display:flex;align-items:center;justify-content:center;padding:2px 10px;font-size:16px;white-space:nowrap;'>" + key + "</div>";
        }

        var formattedText = key + "<br>" + separator;

        if (argData && argData.summary) {
            formattedText += "<span style='padding:4px;'>" + argData.summary + "</span>";
        }

        if (displayMode === 'label-summary-details') {
            var details = argData && argData.details;
            if (details) {
                var formattedDetails = '';
                var isListFormat = false;

                if (typeof details === 'string') {
                    formattedDetails = details;
                } else if (Array.isArray(details)) {
                    details.forEach(function(item) {
                        isListFormat = true;
                        if (typeof item === 'string') {
                            formattedDetails += '<li>' + item + '</li>';
                        } else if (typeof item === 'object' && item !== null) {
                            Object.keys(item).forEach(function(key) {
                                if (item[key]) {
                                    formattedDetails += '<li><i>' + key + '</i>: ' + item[key] + '</li>';
                                } else {
                                    formattedDetails += '<li>' + key + '</li>';
                                }
                            });
                        }
                    });
                } else if (typeof details === 'object') {
                    isListFormat = true;
                    Object.keys(details).forEach(function(key) {
                        if (details[key]) {
                            formattedDetails += '<li><i>' + key + '</i>: ' + details[key] + '</li>';
                        } else {
                            formattedDetails += '<li>' + key + '</li>';
                        }
                    });
                }
                if (formattedDetails) {
                    if (isListFormat) {
                        formattedText += separator + '<ul style="margin:0; text-align:left;">' + formattedDetails + '</ul>';
                    } else {
                        formattedText += separator + formattedDetails;
                    }
                }
            }
        }
        return "<div style='min-width:150px;max-width:350px;word-wrap:break-word;'>" + formattedText + "</div>";
    }

    function initializePanzoom(wrapper, mermaidContainer) {
        panzoomInstance = Panzoom(mermaidContainer, {
            canvas: true,
            startScale: savedZoomLevel != null ? savedZoomLevel : getFitScale(wrapper, mermaidContainer),
            minScale: 0.1,
            maxScale: 5.0
        });
        wrapper.addEventListener('wheel', function(event) {
            if (!event.shiftKey) return;
            panzoomInstance.zoomWithWheel(event);
        });
    }

    function destroyPanzoom() {
        if (panzoomInstance) { panzoomInstance.destroy(); panzoomInstance = null; }
    }

    function reinitPanzoom() {
        if (panzoomInstance) {
            var mermaidContainer = document.getElementById('mermaid-diagram');
            var wrapper = document.getElementById('wrapper');
            if (mermaidContainer && wrapper) {
                panzoomInstance.destroy();
                initializePanzoom(wrapper, mermaidContainer);
            }
        }
    }

    function zoomIn() {
        if (panzoomInstance) {
            panzoomInstance.zoomIn();
            savedZoomLevel = panzoomInstance.getScale();
        }
    }

    function zoomOut() {
        if (panzoomInstance) {
            panzoomInstance.zoomOut();
            savedZoomLevel = panzoomInstance.getScale();
        }
    }

    function fitToScreen() {
        if (panzoomInstance) {
            var mermaidContainer = document.getElementById('mermaid-diagram');
            var wrapper = document.getElementById('wrapper');
            if (mermaidContainer && wrapper) {
                var fitScale = getFitScale(wrapper, mermaidContainer);
                panzoomInstance.zoom(fitScale, { animate: true });
                panzoomInstance.pan(0, 0, { animate: true });
                savedZoomLevel = null;
            }
        }
    }

    function getThemeColors() {
        var theme = sessionStorage.getItem('argblazer_global_sessionTheme') || document.getElementById('theme-selector').value;
        document.getElementById('theme-selector').value = theme;

        switch (theme) {
            case 'xray':
                return {
                    'default': 'fill:#ffffff,stroke:#000000',
                    add: 'fill:#ffffff,stroke:#000000,stroke-width:4px',
                    select: 'fill:#6DCCFA,stroke:#000000',
                    selectadd: 'fill:#6DCCFA,stroke:#000000,stroke-width:4px'
                };
            default:
                return {
                    'default': 'fill:#D5E8D4,stroke:#004d00',
                    add: 'fill:#D5E8D4,stroke:#004d00,stroke-width:4px',
                    select: 'fill:#0F7C0F,stroke:#0F7C0F,color:#ffffff',
                    selectadd: 'fill:#0F7C0F,stroke:#004d00,color:#ffffff,stroke-width:4px'
                };
        }
    }

    function updateExtensionStyling() {
        var themeColors = getThemeColors();
        var root = document.documentElement;

        var selectColors = themeColors.select;
        var fillMatch = selectColors.match(/fill:([^,]+)/);
        var strokeMatch = selectColors.match(/stroke:([^,]+)/);
        var colorMatch = selectColors.match(/color:([^,]+)/);

        if (fillMatch && strokeMatch) {
            root.style.setProperty('--extension-hover-bg', fillMatch[1]);
            root.style.setProperty('--extension-hover-border', strokeMatch[1]);
            root.style.setProperty('--extension-hover-text', colorMatch ? colorMatch[1] : 'inherit');
        }
    }

    async function render() {
        var mermaidContainer = document.getElementById('mermaid-diagram')
        var wrapper = document.getElementById('wrapper');

        mermaidContainer.innerHTML = '';

        var graph = 'graph BT\\n';
        var themeColors = getThemeColors();
        graph += '  classDef default ' + themeColors['default'] + '\\n';
        graph += '  classDef add ' + themeColors.add + '\\n';
        graph += '  classDef select ' + themeColors.select + '\\n';
        graph += '  classDef selectadd ' + themeColors.selectadd + '\\n';

        graph += generateSubgraphs(currentStepIndex);

        var newNodes = currentStepIndex > 0 ? getNewArgumentsForStep(currentStepIndex) : [];
        var newNodeIds = new Set(newNodes.map(function(arg) { return Object.keys(arg)[0]; }));

        var defaultNodes='', addedNodes='', selectedNodes='', selectedAddNodes='';

        nodeData.forEach(function(node) {
            graph += '  ' + node.id + '["' + node.label + '"]\\n';

            if (colors[node.id] !== null) {
                if (newNodeIds.has(node.id)){
                    selectedAddNodes += selectedAddNodes ? ',' + node.id : node.id;
                } else {
                    selectedNodes += selectedNodes ? ',' + node.id : node.id;
                }
            } else if (newNodeIds.has(node.id)) {
                addedNodes += addedNodes ? ',' + node.id : node.id;
            } else {
                defaultNodes += defaultNodes ? ',' + node.id : node.id;
            }
        });

        if (defaultNodes) graph += '  class ' + defaultNodes + ' default\\n';
        if (addedNodes) graph += '  class ' + addedNodes + ' add\\n';
        if (selectedNodes) graph += '  class ' + selectedNodes + ' select\\n';
        if (selectedAddNodes) graph += '  class ' + selectedAddNodes + ' selectadd\\n';

        var filteredAttacks = getFilteredAttacks(currentStepIndex);
        filteredAttacks.forEach(function(attack) {
            var isNewAttack = newNodeIds.has(attack[0]) || newNodeIds.has(attack[1]);
            var arrowType = isNewAttack ? '==>' : '-->';
            graph += '    ' + attack[0] + ' ' + arrowType + ' ' + attack[1] + '\\n';
        });
        try {
            var result = await mermaid.render('diagram-id', graph);
            mermaidContainer.innerHTML = result.svg;

            if (!panzoomInstance) {
                initializePanzoom(wrapper, mermaidContainer);
            }
        } catch (error) {
            console.error('Error rendering mermaid diagram:', error);
        }
    }

    function setupExtensionClickHandlers() {
        var currentlySelected = document.querySelector('.extension-set.selected');

        document.querySelectorAll('.extension-set').forEach(function(setElement) {
            setElement.addEventListener('click', function(event) {
                event.preventDefault();

                if (currentlySelected === setElement) {
                    resetNodeHighlighting();
                    setElement.classList.remove('selected');
                    currentlySelected = null;
                    render();
                    return;
                }

                if (currentlySelected) {
                    currentlySelected.classList.remove('selected');
                }

                setElement.classList.add('selected');
                currentlySelected = setElement;

                var setData = setElement.getAttribute('data-set');
                var nodeIds = parseExtensionSet(setData);
                highlightNodes(nodeIds);
            });
        });
    }

    function parseExtensionSet(setString) {
        if (setString === '{}') return [];
        var content = setString.slice(1, -1).trim();
        return content ? content.split(',').map(function(id) { return id.trim(); }) : [];
    }

    function highlightNodes(nodeIds) {
        if (nodeIds.length === 0) {
            resetNodeHighlighting();
        } else {
            colors = {};
            nodeData.forEach(function(node) {
                colors[node.id] = nodeIds.includes(node.id) ? 'selected' : null;
            });
        }
        render();
    }

    function resetNodeHighlighting() {
        colors = {};
        if (nodeData) {
            nodeData.forEach(function(node) { colors[node.id] = null; });
        }
    }

    function resetExtensionSelection() {
        resetNodeHighlighting();

        document.querySelectorAll('.extension-set.selected').forEach(function(setElement) {
            setElement.classList.remove('selected');
        });
    }

    function fetchNodeData(displayMode) {
        var filteredArguments = getFilteredArguments(currentStepIndex);
        return filteredArguments.map(function(arg) {
            var key = Object.keys(arg)[0];
            var argData = arg[key];
            var hasSummary = argData && argData.summary !== undefined;
            return {
                id: key,
                label: (hasSummary || displayMode === 'label') ? formatMultiLineLabel(key, argData, displayMode) : "<div style='display:flex;align-items:center;justify-content:center;min-width:30px;min-height:30px;aspect-ratio:1;font-size:18px;'>" + key + "</div>",
                shape: 'rect'
            };
        });
    }

    function updateGraph(flag) {
        flag = flag || 'DisplayMode';
        var displayMode = document.getElementById('argument-display-mode').value;
        setFileSpecificStorage('sessionDisplayMode', displayMode);
        nodeData = fetchNodeData(displayMode);
        if (flag === 'DisplayMode') {
            var oldColors = colors || {};
            colors = {};
            nodeData.forEach(function(node) {
                colors[node.id] = oldColors[node.id] || null;
            });
        } else {
            colors = {};
            nodeData.forEach(function(node) { colors[node.id] = null; });
        }

        if (panzoomInstance && flag === 'StepNavigation' && savedZoomLevel !== null) {
            savedZoomLevel = panzoomInstance.getScale();
        }

        destroyPanzoom();
        render();
    }

    function setupToggleBtn(btn, itemId, storageKey) {
        if (!btn) return;
        if (getFileSpecificStorage(storageKey, 'true') === 'false') {
            var item = document.getElementById(itemId);
            btn.classList.toggle('active');
            item.style.display = 'flex';
        }
        btn.addEventListener('click', function() {
            var item = document.getElementById(itemId);
            if (item) {
                btn.classList.toggle('active');
                if (btn.classList.contains('active')) {
                    item.style.display = 'none';
                    setFileSpecificStorage(storageKey, 'true');
                } else {
                    item.style.display = 'flex';
                    setFileSpecificStorage(storageKey, 'false');
                }
            }
        });
    }

    function hasDecisions() {
        var d = argumentationData.decisions;
        return d && typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length > 0;
    }

    function getDecisionSemantics() {
        var d = argumentationData.decisions || {};
        var result = {};
        Object.keys(d).forEach(function(q) {
            var sem = (d[q] && d[q].semantics) ? d[q].semantics : 'preferred';
            result[sem] = true;
        });
        return result;
    }

    function setupControls() {
        var zoomInBtn = document.getElementById('zoom-in-btn');
        var zoomOutBtn = document.getElementById('zoom-out-btn');
        var zoomFitBtn = document.getElementById('zoom-fit-btn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', zoomIn);
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', zoomOut);
        }
        if (zoomFitBtn) {
            zoomFitBtn.addEventListener('click', fitToScreen);
        }

        var themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', function() {
                sessionStorage.setItem('argblazer_global_sessionTheme', themeSelector.value);
                updateExtensionStyling();
                destroyPanzoom();
                render();
            });
        }

        var displayModeSelect = document.getElementById('argument-display-mode');
        if (displayModeSelect) {
            displayModeSelect.addEventListener('change', function() { updateGraph('DisplayMode'); });
        }

        var rankDirectionSelect = document.getElementById('rank-direction');
        if (rankDirectionSelect) {
            rankDirectionSelect.addEventListener('change', function() {
                setFileSpecificStorage('sessionRankDirection', rankDirectionSelect.value);
                destroyPanzoom();
                render();
            });
        }

        var conflictFreeBtn = document.getElementById('toggle-conflict-free');
        var admissibleBtn = document.getElementById('toggle-admissible');
        var showAllBtn = document.getElementById('toggle-show-all');

        setupToggleBtn(conflictFreeBtn, 'conflict-free-item', 'sessionConflictFreeHide');
        setupToggleBtn(admissibleBtn, 'admissible-item', 'sessionAdmissibleHide');

        if (hasDecisions()) {
            if (conflictFreeBtn) conflictFreeBtn.style.display = 'none';
            if (admissibleBtn) admissibleBtn.style.display = 'none';
            if (showAllBtn) {
                showAllBtn.addEventListener('click', function() {
                    showAllActive = !showAllActive;
                    showAllBtn.classList.toggle('active', !showAllActive);
                    if (showAllActive) {
                        if (conflictFreeBtn) conflictFreeBtn.style.display = '';
                        if (admissibleBtn) admissibleBtn.style.display = '';
                    } else {
                        if (conflictFreeBtn) {
                            conflictFreeBtn.style.display = 'none';
                            conflictFreeBtn.classList.add('active');
                        }
                        if (admissibleBtn) {
                            admissibleBtn.style.display = 'none';
                            admissibleBtn.classList.add('active');
                        }
                    }
                    updateExtensionsDisplay();
                });
            }
        } else {
            if (showAllBtn) showAllBtn.style.display = 'none';
        }
    }

    function initializeSectionHeight() {
        var maxSectionHeight = windowHeight / 4;

        var exhibitHeaderHeight = exhibitSection.querySelector('.section-header').offsetHeight;
        var extensionsHeaderHeight = extensionsSection.querySelector('.section-header').offsetHeight;
        var exhibitContentHeight = exhibitContent.scrollHeight;
        var extensionsContentHeight = extensionsContent.scrollHeight;

        var exhibitDesiredHeight = Math.min(exhibitHeaderHeight + exhibitContentHeight, maxSectionHeight);
        var extensionsDesiredHeight = Math.min(extensionsHeaderHeight + extensionsContentHeight, maxSectionHeight);

        var extensionsDesiredHeightCheckedSession = getFileSpecificStorage('sessionExtensionsHeight', extensionsDesiredHeight);

        var exhibitDesiredHeightCheckedSession;
        if (window.getComputedStyle(exhibitSection).display === 'none') {
            exhibitDesiredHeightCheckedSession = 0;
        } else {
            exhibitDesiredHeightCheckedSession = getFileSpecificStorage('sessionExhibitHeight', 'expanded');
            if (exhibitDesiredHeightCheckedSession === 'collapsed') {
                toggleSection('exhibit');
                exhibitDesiredHeightCheckedSession = 0;
            } else {
                if (exhibitDesiredHeightCheckedSession === 'expanded') {
                    exhibitDesiredHeightCheckedSession = exhibitDesiredHeight;
                }
                exhibitSection.style.flex = '0 0 ' + exhibitDesiredHeightCheckedSession + 'px';
            }
        }

        if (extensionsDesiredHeightCheckedSession === 'collapsed') {
            toggleSection('extensions');
            extensionsDesiredHeightCheckedSession = 0;
        } else {
            if (extensionsDesiredHeightCheckedSession === 'expanded') {
                extensionsDesiredHeightCheckedSession = extensionsDesiredHeight;
            }
            extensionsSection.style.flex = '0 0 ' + extensionsDesiredHeightCheckedSession + 'px';
        }
        var decisionsHeight = 0;
        if (window.getComputedStyle(decisionsSection).display !== 'none') {
            var decisionsHeader = decisionsSection.querySelector('.section-header');
            decisionsHeight = decisionsHeader.offsetHeight + decisionsContent.scrollHeight;
            decisionsSection.style.flex = '0 0 ' + decisionsHeight + 'px';
        }
        var graphDesiredHeight = windowHeight - exhibitDesiredHeightCheckedSession - extensionsDesiredHeightCheckedSession - decisionsHeight;
        graphSection.style.flex = '1 1 ' + graphDesiredHeight + 'px';
    }

    function initializeGraph() {
        var displayMode = getFileSpecificStorage('sessionDisplayMode', document.getElementById('argument-display-mode').value);
        document.getElementById('argument-display-mode').value = displayMode;

        var theme = sessionStorage.getItem('argblazer_global_sessionTheme') || document.getElementById('theme-selector').value;
        document.getElementById('theme-selector').value = theme;

        initializeSteps();
        setupStepNavigation();

        var allSets = collectAllSets();
        if (allSets.length > 0) {
            var hasUnassigned = Object.values(argumentationData.arguments).some(function(argData) { return argData && argData.sets === undefined; });
            var setBtn = document.getElementById('set-dropdown-btn');
            var setList = document.getElementById('set-dropdown-list');
            var setWrap = document.getElementById('set-dropdown-wrap');
            var allCheckboxes = [];

            function updateSetBtnText() {
                var total = allCheckboxes.filter(function(cb) { return !cb.disabled; }).length;
                setBtn.textContent = currentSetFilter.length + '/' + total + ' sets selected';
            }

            function applySetFilter() {
                updateSetBtnText();
                updateSelectAllState();
                destroyPanzoom();
                updateGraph('SetFilter');
                resetExtensionSelection();
                updateExtensionsDisplay();
                updateDecisionsDisplay();
            }

            function makeCheckboxItem(value, label) {
                var item = document.createElement('label');
                item.className = 'set-dropdown-item';
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = value;
                cb.addEventListener('change', function() {
                    if (cb.checked) {
                        if (currentSetFilter.indexOf(value) === -1) currentSetFilter.push(value);
                    } else {
                        var idx = currentSetFilter.indexOf(value);
                        if (idx !== -1) currentSetFilter.splice(idx, 1);
                    }
                    applySetFilter();
                });
                item.appendChild(cb);
                item.appendChild(document.createTextNode(label));
                allCheckboxes.push(cb);
                return item;
            }

            allSets.forEach(function(s) {
                setList.appendChild(makeCheckboxItem(s, s));
            });

            var sep1 = document.createElement('hr');
            sep1.className = 'set-dropdown-sep';
            setList.appendChild(sep1);
            var unassignedItem = makeCheckboxItem('__unassigned__', 'unassigned');
            if (!hasUnassigned) {
                unassignedItem.classList.add('disabled');
                unassignedItem.querySelector('input').disabled = true;
            }
            setList.appendChild(unassignedItem);

            var sep2 = document.createElement('hr');
            sep2.className = 'set-dropdown-sep';
            setList.appendChild(sep2);

            var selectAll = document.createElement('div');
            selectAll.className = 'set-dropdown-action';
            selectAll.textContent = 'Select All';
            selectAll.addEventListener('click', function() {
                currentSetFilter = [];
                allCheckboxes.forEach(function(cb) {
                    if (!cb.disabled) {
                        cb.checked = true;
                        currentSetFilter.push(cb.value);
                    }
                });
                applySetFilter();
            });
            setList.appendChild(selectAll);

            var deselectAll = document.createElement('div');
            deselectAll.className = 'set-dropdown-action';
            deselectAll.textContent = 'Deselect All';
            deselectAll.addEventListener('click', function() {
                currentSetFilter = [];
                allCheckboxes.forEach(function(cb) { cb.checked = false; });
                applySetFilter();
            });
            setList.appendChild(deselectAll);

            function updateSelectAllState() {
                var enabledCount = allCheckboxes.filter(function(cb) { return !cb.disabled; }).length;
                if (currentSetFilter.length >= enabledCount) {
                    selectAll.classList.add('disabled');
                } else {
                    selectAll.classList.remove('disabled');
                }
                if (currentSetFilter.length === 0) {
                    deselectAll.classList.add('disabled');
                } else {
                    deselectAll.classList.remove('disabled');
                }
            }

            setBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                setList.classList.toggle('open');
            });

            document.addEventListener('click', function(e) {
                if (!setWrap.contains(e.target)) {
                    setList.classList.remove('open');
                }
            });

            allCheckboxes.forEach(function(cb) {
                if (!cb.disabled) {
                    cb.checked = true;
                    currentSetFilter.push(cb.value);
                }
            });
            updateSetBtnText();
            updateSelectAllState();
            document.getElementById('set-filter-controls').style.display = '';
        }

        mermaid.initialize({
            startOnLoad: false,
            flowchart: {
                padding: 0.01,
                htmlLabels: true,
                wrappingWidth: 240
            }
        });

        colors = {};
        nodeData = fetchNodeData(displayMode);
        nodeData.forEach(function(node) { colors[node.id] = null; });
        render();
        setupExtensionClickHandlers();
        setupControls();
        updateExtensionStyling();
    }

    function toggleSection(sectionName) {
        var content = document.getElementById(sectionName + '-content');
        var toggle = document.getElementById(sectionName + '-toggle');
        var section = document.getElementById(sectionName + '-section');

        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            content.style.maxHeight = '';

            if (section) {
                var totalHeight = section.querySelector('.section-header').offsetHeight + content.scrollHeight;
                totalHeight = Math.min(totalHeight, windowHeight / 4);
                section.style.flex = '0 1 ' + totalHeight + 'px';
            }
            if (sectionName === 'exhibit') {
                setFileSpecificStorage('sessionExhibitHeight', 'expanded');
            } else if (sectionName === 'extensions') {
                setFileSpecificStorage('sessionExtensionsHeight', 'expanded');
            }
        } else {
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
            content.style.maxHeight = '0';
            if (section) {
                section.style.flex = '0 0 auto';
            }
            if (sectionName === 'exhibit') {
                setFileSpecificStorage('sessionExhibitHeight', 'collapsed');
            } else if (sectionName === 'extensions') {
                setFileSpecificStorage('sessionExtensionsHeight', 'collapsed');
            }
        }

        setTimeout(reinitPanzoom, 300);
    }

    function getExtensionsForStep(stepIndex) {
        var filteredArgs = getFilteredArguments(stepIndex);
        var argIds = filteredArgs.map(function(arg) { return Object.keys(arg)[0]; });
        var attacks = getFilteredAttacks(stepIndex);
        return computeExtensions(argIds, attacks);
    }

    function updateExtensionsDisplay() {
        var extensionsGrid = document.getElementById('extensions-grid');

        var prevSelected = extensionsGrid.querySelector('.extension-set.selected');
        var prevSelectedData = prevSelected ? prevSelected.getAttribute('data-set') : null;
        var prevSelectedTypeId = prevSelected ? prevSelected.closest('.extension-item').id : null;

        extensionsGrid.innerHTML = '';

        var extensions = getExtensionsForStep(currentStepIndex);

        var extensionTypes = [
            { key: 'grounded', label: 'Grounded', id: 'grounded-item', hidden: false },
            { key: 'stable', label: 'Stable', id: 'stable-item', hidden: false },
            { key: 'complete', label: 'Complete', id: 'complete-item', hidden: false },
            { key: 'preferred', label: 'Preferred', id: 'preferred-item', hidden: false },
            { key: 'conflict_free', label: 'Conflict-free', id: 'conflict-free-item', hidden: true },
            { key: 'admissible', label: 'Admissible', id: 'admissible-item', hidden: true }
        ];

        extensionTypes.forEach(function(type) {
            var itemDiv = document.createElement('div');
            itemDiv.className = 'extension-item';
            itemDiv.id = type.id;

            var shouldHide = type.hidden;
            if (type.key === 'conflict_free') {
                var conflictFreeBtn = document.getElementById('toggle-conflict-free');
                shouldHide = conflictFreeBtn && conflictFreeBtn.classList.contains('active');
            } else if (type.key === 'admissible') {
                var admissibleBtn = document.getElementById('toggle-admissible');
                shouldHide = admissibleBtn && admissibleBtn.classList.contains('active');
            } else if (hasDecisions() && !showAllActive) {
                shouldHide = !getDecisionSemantics()[type.key];
            }

            if (shouldHide) {
                itemDiv.style.display = 'none';
            }

            var labelSpan = document.createElement('span');
            labelSpan.className = 'extension-label';
            labelSpan.textContent = type.label + ':';

            var valuesSpan = document.createElement('span');
            valuesSpan.className = 'extension-values';

            var extensionSets = extensions[type.key] || [];

            extensionSets.forEach(function(ext, index) {
                var setSpan = document.createElement('span');
                setSpan.className = 'extension-set';
                var setString;
                if (Array.isArray(ext)) {
                    setString = '{' + ext.join(', ') + '}';
                } else {
                    setString = ext.toString();
                }
                setSpan.setAttribute('data-set', setString);
                setSpan.textContent = setString;
                if (setString === prevSelectedData && type.id === prevSelectedTypeId) {
                    setSpan.classList.add('selected');
                }
                valuesSpan.appendChild(setSpan);
            });

            itemDiv.appendChild(labelSpan);
            itemDiv.appendChild(valuesSpan);
            extensionsGrid.appendChild(itemDiv);
        });

        setupExtensionClickHandlers();
    }

    (function() {
        var graphContainer = document.getElementById('graph-container');
        if (graphContainer && window.ResizeObserver) {
            new ResizeObserver(function() { reinitPanzoom(); }).observe(graphContainer);
        } else {
            window.addEventListener('resize', reinitPanzoom);
        }
    })();

    var lastWindowWidth = document.body.getBoundingClientRect().width;
    window.addEventListener('resize', function() {
        var newWidth = document.body.getBoundingClientRect().width;
        if (newWidth === lastWindowWidth) return;
        lastWindowWidth = newWidth;
        if (window.getComputedStyle(decisionsSection).display !== 'none'
                && !decisionsContent.classList.contains('collapsed')) {
            decisionsSection.style.flex = '0 0 auto';
            var dh = decisionsSection.querySelector('.section-header');
            var newDecisionsHeight = dh.offsetHeight + decisionsContent.scrollHeight;
            decisionsSection.style.flex = '0 0 ' + newDecisionsHeight + 'px';
        }
    });

    function setupResizeHandles() {
        var isResizing = false;
        var currentHandle = null;
        var startY = 0;
        var startExhibitHeight = 0;
        var startExtensionsHeight = 0;
        var startDecisionsHeight = 0;

        function startResize(e, handle) {
            isResizing = true;
            currentHandle = handle;
            startY = e.touches ? e.touches[0].clientY : e.clientY;

            startExhibitHeight = exhibitSection.getBoundingClientRect().height;
            startExtensionsHeight = extensionsSection.getBoundingClientRect().height;
            startDecisionsHeight = decisionsSection.getBoundingClientRect().height;

            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';

            e.preventDefault();
        }

        function doResize(e) {
            if (!isResizing || !currentHandle) return;

            var clientY = e.touches ? e.touches[0].clientY : e.clientY;
            var deltaY = clientY - startY;

            var exhibitHeader = exhibitSection.querySelector('.section-header');
            var extensionsHeader = extensionsSection.querySelector('.section-header');
            var exhibitMinHeight = exhibitHeader.getBoundingClientRect().height;
            var extensionsMinHeight = extensionsHeader.getBoundingClientRect().height;
            var graphMinHeight = 250;

            var collapseThreshold = 20;

            if (currentHandle === handle0) {
                var exhibitCollapsed = exhibitContent.classList.contains('collapsed');
                var targetExhibitHeight = startExhibitHeight + deltaY;

                if (!exhibitCollapsed) {
                    if (targetExhibitHeight <= exhibitMinHeight + collapseThreshold) {
                        toggleSection('exhibit');
                    } else {
                        var available0 = windowHeight - startExtensionsHeight - startDecisionsHeight;
                        var maxExhibitHeight0 = available0 - graphMinHeight;
                        var newExhibitHeight0 = Math.max(
                            exhibitMinHeight + collapseThreshold,
                            Math.min(maxExhibitHeight0, targetExhibitHeight)
                        );

                        exhibitSection.style.flex = '0 0 ' + newExhibitHeight0 + 'px';
                        graphSection.style.flex = '1 1 0';
                        extensionsSection.style.flex = '0 0 ' + startExtensionsHeight + 'px';

                        setFileSpecificStorage('sessionExhibitHeight', newExhibitHeight0.toString());
                        setFileSpecificStorage('sessionExtensionsHeight', startExtensionsHeight.toString());
                    }
                } else {
                    if (targetExhibitHeight > exhibitMinHeight + collapseThreshold) {
                        toggleSection('exhibit');
                    }
                }

            } else if (currentHandle === handle1) {
                var decisionsVisible1 = window.getComputedStyle(decisionsSection).display !== 'none';

                if (decisionsVisible1) {
                    var decisionsCollapsed1 = decisionsContent.classList.contains('collapsed');
                    var decisionsHeader1 = decisionsSection.querySelector('.section-header');
                    var decisionsMinHeight1 = decisionsHeader1.getBoundingClientRect().height;
                    var targetDecisionsHeight = startDecisionsHeight + deltaY;

                    if (!decisionsCollapsed1) {
                        if (targetDecisionsHeight <= decisionsMinHeight1 + collapseThreshold) {
                            toggleSection('decisions');
                        } else {
                            var availableForDecisionsAndGraph = windowHeight - startExtensionsHeight - startExhibitHeight;
                            var maxDecisionsHeight = availableForDecisionsAndGraph - graphMinHeight;
                            var newDecisionsHeight = Math.max(
                                decisionsMinHeight1 + collapseThreshold,
                                Math.min(maxDecisionsHeight, targetDecisionsHeight)
                            );
                            if (window.getComputedStyle(exhibitSection).display !== 'none') {
                                exhibitSection.style.flex = '0 0 ' + startExhibitHeight + 'px';
                            }
                            decisionsSection.style.flex = '0 0 ' + newDecisionsHeight + 'px';
                            graphSection.style.flex = '1 1 0';
                            extensionsSection.style.flex = '0 0 ' + startExtensionsHeight + 'px';
                        }
                    } else {
                        if (targetDecisionsHeight > decisionsMinHeight1 + collapseThreshold) {
                            toggleSection('decisions');
                        }
                    }
                } else {
                    var exhibitCollapsed1 = exhibitContent.classList.contains('collapsed');
                    var targetExhibitHeight1 = startExhibitHeight + deltaY;

                    if (!exhibitCollapsed1) {
                        if (targetExhibitHeight1 <= exhibitMinHeight + collapseThreshold) {
                            toggleSection('exhibit');
                        } else {
                            var available1 = windowHeight - startExtensionsHeight;
                            var maxExhibitHeight1 = available1 - graphMinHeight;
                            var newExhibitHeight1 = Math.max(
                                exhibitMinHeight + collapseThreshold,
                                Math.min(maxExhibitHeight1, targetExhibitHeight1)
                            );
                            exhibitSection.style.flex = '0 0 ' + newExhibitHeight1 + 'px';
                            graphSection.style.flex = '1 1 0';
                            extensionsSection.style.flex = '0 0 ' + startExtensionsHeight + 'px';
                            setFileSpecificStorage('sessionExhibitHeight', newExhibitHeight1.toString());
                            setFileSpecificStorage('sessionExtensionsHeight', startExtensionsHeight.toString());
                        }
                    } else {
                        if (targetExhibitHeight1 > exhibitMinHeight + collapseThreshold) {
                            toggleSection('exhibit');
                        }
                    }
                }

            } else if (currentHandle === handle2) {
                var extensionsCollapsed = extensionsContent.classList.contains('collapsed');

                var targetExtensionsHeight = startExtensionsHeight - deltaY;

                if (!extensionsCollapsed) {
                    if (targetExtensionsHeight <= extensionsMinHeight + collapseThreshold) {
                        toggleSection('extensions');
                    } else {
                        var availableForGraphAndExtensions = windowHeight - startExhibitHeight - startDecisionsHeight;

                        var maxExtensionsHeight = availableForGraphAndExtensions - graphMinHeight;
                        var newExtensionsHeight = Math.max(
                            extensionsMinHeight + collapseThreshold,
                            Math.min(maxExtensionsHeight, targetExtensionsHeight)
                        );

                        exhibitSection.style.flex = '0 0 ' + startExhibitHeight + 'px';
                        graphSection.style.flex = '1 1 0';
                        extensionsSection.style.flex = '0 0 ' + newExtensionsHeight + 'px';

                        setFileSpecificStorage('sessionExhibitHeight', startExhibitHeight.toString());
                        setFileSpecificStorage('sessionExtensionsHeight', newExtensionsHeight.toString());
                    }
                } else {
                    if (targetExtensionsHeight > extensionsMinHeight + collapseThreshold) {
                        toggleSection('extensions');
                    }
                }
            }

            setTimeout(reinitPanzoom, 50);
        }

        function stopResize() {
            if (!isResizing) return;

            isResizing = false;
            currentHandle = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        handle0.addEventListener('mousedown', function(e) { startResize(e, handle0); });
        handle1.addEventListener('mousedown', function(e) { startResize(e, handle1); });
        handle2.addEventListener('mousedown', function(e) { startResize(e, handle2); });
        handle0.addEventListener('touchstart', function(e) { startResize(e, handle0); }, { passive: false });
        handle1.addEventListener('touchstart', function(e) { startResize(e, handle1); }, { passive: false });
        handle2.addEventListener('touchstart', function(e) { startResize(e, handle2); }, { passive: false });

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchmove', doResize, { passive: false });
        document.addEventListener('touchend', stopResize);

        document.addEventListener('selectstart', function(e) {
            if (isResizing) e.preventDefault();
        });
    }

    function getFileSpecificKey(key) {
        return 'argblazer_' + fileKey + '_' + key;
    }

    function getFileSpecificStorage(key, defaultValue) {
        return sessionStorage.getItem(getFileSpecificKey(key)) || defaultValue;
    }

    function setFileSpecificStorage(key, value) {
        sessionStorage.setItem(getFileSpecificKey(key), value);
    }

    function updateDecisionsDisplay() {
        var decisionsList = document.getElementById('decisions-list');
        if (!decisionsList) return;

        var decisions = argumentationData.decisions;
        if (!decisions || typeof decisions !== 'object' || Array.isArray(decisions) || Object.keys(decisions).length === 0) {
            decisionsSection.style.display = 'none';
            updateResizeHandleVisibility();
            return;
        }

        decisionsSection.style.display = 'flex';
        decisionsList.innerHTML = '';

        var extensions = getExtensionsForStep(currentStepIndex);

        Object.keys(decisions).forEach(function(question) {
            var dec = decisions[question] || {};
            var semanticsType = dec.semantics !== undefined ? dec.semantics : 'preferred';
            var criterion = dec.criterion !== undefined ? String(dec.criterion) : null;
            var quantifier = dec.quantifier !== undefined ? dec.quantifier : 'at least one';

            if (criterion === null) return;

            var extList = extensions[semanticsType] || [];
            var answer;
            if (quantifier === 'at least one') {
                answer = extList.some(function(ext) { return ext.indexOf(criterion) !== -1; });
            } else if (quantifier === 'all') {
                answer = extList.length > 0 && extList.every(function(ext) { return ext.indexOf(criterion) !== -1; });
            } else {
                answer = extList.every(function(ext) { return ext.indexOf(criterion) === -1; });
            }

            var itemDiv = document.createElement('div');
            itemDiv.className = 'decision-item';

            var questionSpan = document.createElement('span');
            questionSpan.className = 'decision-question';
            questionSpan.textContent = question;

            var semanticsDisplay = semanticsType.replace(/_/g, ' ');
            var answerSpan = document.createElement('span');
            answerSpan.className = 'decision-answer ' + (answer ? 'yes' : 'no');
            var v = function(t) { return '<span class="decision-value">' + t + '</span>'; };
            var phrase;
            if (quantifier === 'at least one') {
                phrase = v('at least one') + ' ' + v(semanticsDisplay) + ' extension';
            } else if (quantifier === 'all') {
                phrase = v('all') + ' ' + v(semanticsDisplay) + ' extensions';
            } else if (quantifier === 'none') {
                phrase = v('none') + ' of the ' + v(semanticsDisplay) + ' extensions';
            } else {
                phrase = v(quantifier) + ' ' + v(semanticsDisplay) + ' extensions';
            }
            answerSpan.innerHTML = (answer ? 'Yes' : 'No')
                + ', it is ' + (answer ? '' : 'not ') + 'the case that the criterion '
                + v(criterion) + ' holds in ' + phrase + '.';

            itemDiv.appendChild(questionSpan);
            itemDiv.appendChild(answerSpan);
            decisionsList.appendChild(itemDiv);
        });

        updateResizeHandleVisibility();
    }

    var windowHeight = document.body.getBoundingClientRect().height - 50;
    var handle0 = document.getElementById('resize-handle-0');
    var handle1 = document.getElementById('resize-handle-1');
    var handle2 = document.getElementById('resize-handle-2');
    var exhibitSection = document.getElementById('exhibit-section');
    var decisionsSection = document.getElementById('decisions-section');
    var graphSection = document.getElementById('graph-section');
    var extensionsSection = document.getElementById('extensions-section');
    var exhibitContent = document.getElementById('exhibit-content');
    var decisionsContent = document.getElementById('decisions-content');
    var extensionsContent = document.getElementById('extensions-content');

    initializeGraph();
    initializeSectionHeight();
    setupResizeHandles();
    updateResizeHandleVisibility();

    (function() {
        var graphSectionHeader = graphSection.querySelector('.section-header');
        var themeControls = document.getElementById('theme-selector').parentElement;
        var rankControls = document.getElementById('rank-direction').parentElement;
        var displayControls = document.getElementById('argument-display-mode').parentElement;
        var setFilterControls = document.getElementById('set-filter-controls');
        var stepNav = document.querySelector('.step-navigation');

        function isWrapping() {
            var refRect = stepNav.getBoundingClientRect();
            var refMid = (refRect.top + refRect.bottom) / 2;
            return [themeControls, rankControls, displayControls, setFilterControls].some(function(el) {
                if (el.style.display === 'none') return false;
                var rect = el.getBoundingClientRect();
                return Math.abs((rect.top + rect.bottom) / 2 - refMid) > 5;
            });
        }

        function updateVisibility() {
            themeControls.style.display = '';
            rankControls.style.display = '';
            displayControls.style.display = '';
            if (!isWrapping()) return;
            themeControls.style.display = 'none';
            if (!isWrapping()) return;
            rankControls.style.display = 'none';
            if (!isWrapping()) return;
            displayControls.style.display = 'none';
        }

        new ResizeObserver(updateVisibility).observe(graphSectionHeader);
    })();
`;
}

export function getExtensionFuncs(): string {
    return `
    function isConflictFree(subset, attacks) {
        for (const [a, b] of attacks) {
            if (subset.has(a) && subset.has(b)) return false;
        }
        return true;
    }

    function isDefended(arg, subset, attacks) {
        for (const [attacker, target] of attacks) {
            if (target === arg) {
                let defended = false;
                for (const [z, t] of attacks) {
                    if (t === attacker && subset.has(z)) { defended = true; break; }
                }
                if (!defended) return false;
            }
        }
        return true;
    }

    function isAdmissible(subset, attacks) {
        if (!isConflictFree(subset, attacks)) return false;
        for (const x of subset) {
            if (!isDefended(x, subset, attacks)) return false;
        }
        return true;
    }

    function isComplete(subset, args, attacks) {
        if (!isAdmissible(subset, attacks)) return false;
        for (const x of args) {
            if (subset.has(x)) continue;
            if (isDefended(x, subset, attacks)) return false;
        }
        return true;
    }

    function isStable(subset, args, attacks) {
        if (!isConflictFree(subset, attacks)) return false;
        for (const x of args) {
            if (subset.has(x)) continue;
            let attacked = false;
            for (const [a, b] of attacks) {
                if (b === x && subset.has(a)) { attacked = true; break; }
            }
            if (!attacked) return false;
        }
        return true;
    }

    function isProperSuperset(a, b) {
        if (a.size <= b.size) return false;
        for (const x of b) {
            if (!a.has(x)) return false;
        }
        return true;
    }

    function computeGrounded(args, attacks) {
        const inSet = new Set();
        const outSet = new Set();
        let changed = true;
        while (changed) {
            changed = false;
            for (const x of args) {
                if (inSet.has(x) || outSet.has(x)) continue;
                const attackers = [];
                for (const [a, b] of attacks) {
                    if (b === x) attackers.push(a);
                }
                if (attackers.every(function(y) { return outSet.has(y); })) {
                    inSet.add(x);
                    changed = true;
                }
            }
            for (const [a, b] of attacks) {
                if (inSet.has(a) && !outSet.has(b)) {
                    outSet.add(b);
                    changed = true;
                }
            }
        }
        return inSet;
    }

    function extractConflictFreeSets(args, attacks) {
        const n = args.length;
        const argIndex = {};
        for (let i = 0; i < n; i++) argIndex[args[i]] = i;
        const conflictMask = [];
        for (let i = 0; i < n; i++) conflictMask.push(0n);
        for (const [a, b] of attacks) {
            const ai = argIndex[a];
            const bi = argIndex[b];
            conflictMask[ai] |= (1n << BigInt(bi));
            conflictMask[bi] |= (1n << BigInt(ai));
        }
        const result = [];
        const current = new Set();
        function backtrack(index, blocked) {
            result.push(new Set(current));
            for (let i = index; i < n; i++) {
                const bit = 1n << BigInt(i);
                if (blocked & bit) continue;
                if (conflictMask[i] & bit) continue;
                current.add(args[i]);
                backtrack(i + 1, blocked | conflictMask[i]);
                current.delete(args[i]);
            }
        }
        backtrack(0, 0n);
        return result;
    }

    function computeExtensions(args, attacks) {
        const argOrder = {};
        args.forEach(function(a, i) { argOrder[a] = i; });
        function setToOrderedArray(s) { return Array.from(s).sort(function(a, b) { return argOrder[a] - argOrder[b]; }); }

        const conflictFree = extractConflictFreeSets(args, attacks);
        const admissible = conflictFree.filter(function(s) { return isAdmissible(s, attacks); });
        const complete = admissible.filter(function(s) { return isComplete(s, args, attacks); });
        const preferred = admissible.filter(function(ext) {
            return !admissible.some(function(other) { return other !== ext && isProperSuperset(other, ext); });
        });
        const grounded = computeGrounded(args, attacks);
        const stable = conflictFree.filter(function(s) { return isStable(s, args, attacks); });
        return {
            conflict_free: conflictFree.map(setToOrderedArray),
            admissible: admissible.map(setToOrderedArray),
            complete: complete.map(setToOrderedArray),
            preferred: preferred.map(setToOrderedArray),
            grounded: [setToOrderedArray(grounded)],
            stable: stable.map(setToOrderedArray)
        };
    }`;
}

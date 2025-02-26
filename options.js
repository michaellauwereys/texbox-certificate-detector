document.addEventListener('DOMContentLoaded', function() {
    const elementRulesContainer = document.getElementById('elementRules');
    const highlightPreview = document.getElementById('highlightPreview');
    const highlightOpacity = document.getElementById('highlightOpacity');
    const importFile = document.getElementById('importFile');

    // Update highlight preview when opacity changes
    function updateHighlightPreview() {
        const opacity = highlightOpacity.value;
        highlightPreview.style.backgroundColor = `rgba(255, 87, 51, ${opacity})`;
    }

    highlightOpacity.addEventListener('input', updateHighlightPreview);

    function createRuleElement(selector = '') {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'element-rule';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'rule-input';
        input.value = selector;
        input.placeholder = 'Enter CSS selector (e.g., textarea, .class-name, #id-name)';
        
        const deleteButton = document.createElement('button');
        deleteButton.title = 'Delete rule';
        deleteButton.addEventListener('click', () => ruleDiv.remove());
        
        ruleDiv.appendChild(input);
        ruleDiv.appendChild(deleteButton);
        return ruleDiv;
    }

    document.getElementById('addRule').addEventListener('click', function() {
        elementRulesContainer.appendChild(createRuleElement());
    });

    // Export options
    document.getElementById('exportOptions').addEventListener('click', function() {
        const options = {
            showCertId: document.getElementById('showCertId').checked,
            showSubject: document.getElementById('showSubject').checked,
            showIssuer: document.getElementById('showIssuer').checked,
            showValidFrom: document.getElementById('showValidFrom').checked,
            showValidTo: document.getElementById('showValidTo').checked,
            showFingerprint: document.getElementById('showFingerprint').checked,
            elementRules: Array.from(document.querySelectorAll('.rule-input'))
                .map(input => input.value.trim())
                .filter(rule => rule !== ''),
            dateFormat: document.getElementById('dateFormat').value,
            timeFormat: document.getElementById('timeFormat').value,
            enableHighlighting: document.getElementById('enableHighlighting').checked,
            highlightOpacity: parseFloat(document.getElementById('highlightOpacity').value),
            timezone: document.getElementById('timezone').value
        };

        const blob = new Blob([JSON.stringify(options, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certificate-detector-options.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Import options
    document.getElementById('importOptions').addEventListener('click', function() {
        importFile.click();
    });

    importFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const options = JSON.parse(e.target.result);
                
                // Validate required fields
                const requiredFields = ['showCertId', 'showSubject', 'showIssuer', 'showValidFrom', 
                                     'showValidTo', 'showFingerprint', 'elementRules', 'dateFormat', 
                                     'timeFormat', 'enableHighlighting', 'highlightOpacity', 'timezone'];
                
                const missingFields = requiredFields.filter(field => !(field in options));
                if (missingFields.length > 0) {
                    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
                }

                // Apply options
                document.getElementById('showCertId').checked = options.showCertId;
                document.getElementById('showSubject').checked = options.showSubject;
                document.getElementById('showIssuer').checked = options.showIssuer;
                document.getElementById('showValidFrom').checked = options.showValidFrom;
                document.getElementById('showValidTo').checked = options.showValidTo;
                document.getElementById('showFingerprint').checked = options.showFingerprint;
                document.getElementById('dateFormat').value = options.dateFormat;
                document.getElementById('timeFormat').value = options.timeFormat;
                document.getElementById('enableHighlighting').checked = options.enableHighlighting;
                document.getElementById('highlightOpacity').value = options.highlightOpacity;
                document.getElementById('timezone').value = options.timezone;

                // Clear existing rules
                while (elementRulesContainer.firstChild) {
                    elementRulesContainer.removeChild(elementRulesContainer.firstChild);
                }

                // Add imported rules
                options.elementRules.forEach(rule => {
                    elementRulesContainer.appendChild(createRuleElement(rule));
                });

                // Update preview
                updateHighlightPreview();

                // Show success message
                const status = document.getElementById('status');
                status.textContent = 'Options imported successfully!';
                setTimeout(() => status.textContent = '', 2000);

            } catch (error) {
                const status = document.getElementById('status');
                status.textContent = `Error importing options: ${error.message}`;
                status.style.color = '#e53e3e';
                setTimeout(() => {
                    status.textContent = '';
                    status.style.color = '#38a169';
                }, 3000);
            }
        };
        reader.readAsText(file);
        // Reset file input
        e.target.value = '';
    });

    // Load saved options
    browser.storage.sync.get({
        // Default values
        showCertId: true,
        showSubject: true,
        showIssuer: true,
        showValidFrom: true,
        showValidTo: true,
        showFingerprint: true,
        elementRules: ['textarea'],
        dateFormat: 'eu-short',
        timeFormat: '24',
        enableHighlighting: true,
        highlightOpacity: 0.3,
        timezone: 'UTC'
    }).then(items => {
        // Set checkbox states based on saved options
        document.getElementById('showCertId').checked = items.showCertId;
        document.getElementById('showSubject').checked = items.showSubject;
        document.getElementById('showIssuer').checked = items.showIssuer;
        document.getElementById('showValidFrom').checked = items.showValidFrom;
        document.getElementById('showValidTo').checked = items.showValidTo;
        document.getElementById('showFingerprint').checked = items.showFingerprint;
        document.getElementById('dateFormat').value = items.dateFormat;
        document.getElementById('timeFormat').value = items.timeFormat;
        document.getElementById('enableHighlighting').checked = items.enableHighlighting;
        document.getElementById('highlightOpacity').value = items.highlightOpacity;
        document.getElementById('timezone').value = items.timezone;

        // Create element rules
        items.elementRules.forEach(rule => {
            elementRulesContainer.appendChild(createRuleElement(rule));
        });

        // Initialize highlight preview
        updateHighlightPreview();
    });

    // Save options when the save button is clicked
    document.getElementById('saveOptions').addEventListener('click', function() {
        const options = {
            showCertId: document.getElementById('showCertId').checked,
            showSubject: document.getElementById('showSubject').checked,
            showIssuer: document.getElementById('showIssuer').checked,
            showValidFrom: document.getElementById('showValidFrom').checked,
            showValidTo: document.getElementById('showValidTo').checked,
            showFingerprint: document.getElementById('showFingerprint').checked,
            elementRules: Array.from(document.querySelectorAll('.rule-input'))
                .map(input => input.value.trim())
                .filter(rule => rule !== ''),
            dateFormat: document.getElementById('dateFormat').value,
            timeFormat: document.getElementById('timeFormat').value,
            enableHighlighting: document.getElementById('enableHighlighting').checked,
            highlightOpacity: parseFloat(document.getElementById('highlightOpacity').value),
            timezone: document.getElementById('timezone').value
        };

        browser.storage.sync.set(options).then(() => {
            const status = document.getElementById('status');
            status.textContent = 'Options saved!';
            setTimeout(function() {
                status.textContent = '';
            }, 2000);
        });
    });
}); 
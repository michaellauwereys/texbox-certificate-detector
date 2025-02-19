document.addEventListener('DOMContentLoaded', function() {
    const elementRulesContainer = document.getElementById('elementRules');

    function createRuleElement(selector = '') {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'element-rule';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'rule-input';
        input.value = selector;
        input.placeholder = 'Enter CSS selector (e.g., textarea, .class-name, #id-name)';
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '✕';
        deleteButton.title = 'Delete rule';
        deleteButton.addEventListener('click', () => ruleDiv.remove());
        
        ruleDiv.appendChild(input);
        ruleDiv.appendChild(deleteButton);
        return ruleDiv;
    }

    document.getElementById('addRule').addEventListener('click', function() {
        elementRulesContainer.appendChild(createRuleElement());
    });

    // Load saved settings
    browser.storage.sync.get({
        // Default values
        showCertId: true,
        showSubject: true,
        showIssuer: true,
        showValidFrom: true,
        showValidTo: true,
        showFingerprint: true,
        elementRules: ['textarea'],
        dateFormat: 'short',
        timeFormat: '24',
        enableHighlighting: true,
        highlightOpacity: 0.3,
        timezone: 'UTC'
    }).then(items => {
        // Set checkbox states based on saved settings
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
    });

    // Save settings when the save button is clicked
    document.getElementById('saveSettings').addEventListener('click', function() {
        const settings = {
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

        browser.storage.sync.set(settings).then(() => {
            const status = document.getElementById('status');
            status.textContent = 'Settings saved!';
            setTimeout(function() {
                status.textContent = '';
            }, 2000);
        });
    });
}); 
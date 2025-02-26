// Create a connection to the content script
let port = null;

document.addEventListener('DOMContentLoaded', function() {
    // First get the settings
    browser.storage.sync.get({
        // Default values
        showCertId: true,
        showSubject: true,
        showIssuer: true,
        showValidFrom: true,
        showValidTo: true,
        showFingerprint: true,
        enableHighlighting: true
    }).then(settings => {
        // Then query for certificates
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            // Create port connection
            port = browser.tabs.connect(tabs[0].id, {name: "popup"});
            
            // Send getCertificates message through port
            port.postMessage({action: "getCertificates"});
            
            // Listen for response
            port.onMessage.addListener(function(response) {
                if (response.action === "certificatesFound") {
                    const certificatesDiv = document.getElementById('certificates');
                    certificatesDiv.textContent = ''; // Clear existing content
                    
                    if (response.certificates && response.certificates.length > 0) {
                        // Create a map to track duplicates by certId
                        const certIdCount = new Map();
                        response.certificates.forEach(cert => {
                            certIdCount.set(cert.certId, (certIdCount.get(cert.certId) || 0) + 1);
                        });

                        response.certificates.forEach(cert => {
                            const certDiv = document.createElement('div');
                            certDiv.className = 'cert-container' + (!cert.validationStatus?.isValid ? ' invalid-cert' : '');
                            
                            if (settings.showCertId) {
                                const certIdDiv = document.createElement('div');
                                certIdDiv.className = 'cert-id';
                                
                                if (!cert.isTextarea && settings.enableHighlighting) {
                                    certIdDiv.style.color = cert.highlightColor;
                                    certIdDiv.style.backgroundColor = cert.highlightColor + '33';
                                }

                                const certIdSpan = document.createElement('span');
                                certIdSpan.textContent = `Certificate ID: ${cert.certId}`;
                                certIdDiv.appendChild(certIdSpan);

                                // Add warnings container
                                const warningContainer = document.createElement('div');
                                warningContainer.className = 'warning-container';

                                const warnings = [];
                                if (!cert.validationStatus?.isValid) {
                                    warnings.push(...cert.validationStatus.issues);
                                }
                                if (certIdCount.get(cert.certId) > 1) {
                                    warnings.push(`This certificate appears ${certIdCount.get(cert.certId)} times on this page`);
                                }

                                if (warnings.length > 0) {
                                    const warningIcon = document.createElement('span');
                                    warningIcon.className = 'warning-icon';
                                    warningIcon.textContent = '⚠';

                                    const tooltip = document.createElement('div');
                                    tooltip.className = 'tooltip';

                                    const warningList = document.createElement('ul');
                                    warnings.forEach(warning => {
                                        const li = document.createElement('li');
                                        li.textContent = warning;
                                        warningList.appendChild(li);
                                    });

                                    tooltip.appendChild(warningList);
                                    warningIcon.appendChild(tooltip);
                                    warningContainer.appendChild(warningIcon);
                                }

                                certIdDiv.appendChild(warningContainer);
                                certDiv.appendChild(certIdDiv);
                            }
                            
                            const detailsDiv = document.createElement('div');
                            detailsDiv.className = 'cert-details';

                            const createDetailRow = (label, value) => {
                                if (value) {
                                    const div = document.createElement('div');
                                    div.textContent = `${label}: ${value}`;
                                    detailsDiv.appendChild(div);
                                }
                            };

                            if (settings.showSubject) {
                                createDetailRow('Subject', cert.subject);
                            }
                            if (settings.showIssuer) {
                                createDetailRow('Issuer', cert.issuer);
                            }
                            if (settings.showValidFrom) {
                                createDetailRow('Valid From', cert.validFrom);
                            }
                            if (settings.showValidTo) {
                                createDetailRow('Valid To', cert.validTo);
                            }
                            if (settings.showFingerprint && cert.fingerprint) {
                                createDetailRow('Fingerprint', cert.fingerprint);
                            }

                            certDiv.appendChild(detailsDiv);
                            certificatesDiv.appendChild(certDiv);
                        });
                    } else {
                        const noResults = document.createElement('div');
                        noResults.textContent = 'No certificates found on this page.';
                        certificatesDiv.appendChild(noResults);
                    }
                }
            });
        });
    });
});

// Use beforeunload instead of unload for more reliable cleanup
window.addEventListener('beforeunload', function(event) {
    // Send cleanup message synchronously
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, {action: "cleanupHighlights"});
    });
}); 
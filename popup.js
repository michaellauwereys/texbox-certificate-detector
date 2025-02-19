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
                    
                    if (response.certificates && response.certificates.length > 0) {
                        // Create a map to track duplicates by certId
                        const certIdCount = new Map();
                        response.certificates.forEach(cert => {
                            certIdCount.set(cert.certId, (certIdCount.get(cert.certId) || 0) + 1);
                        });

                        response.certificates.forEach(cert => {
                            const certDiv = document.createElement('div');
                            certDiv.className = 'cert-container' + (!cert.validationStatus?.isValid ? ' invalid-cert' : '');
                            
                            let certHtml = '';
                            
                            if (settings.showCertId) {
                                let idHtml = '';
                                if (cert.isTextarea) {
                                    // Plain display for textarea certificates
                                    idHtml = `<div class="cert-id" style="color: inherit; background: none;">Certificate ID: ${cert.certId}`;
                                } else {
                                    // Colored display for other certificates
                                    const style = settings.enableHighlighting ? 
                                        `style="color: ${cert.highlightColor}; background-color: ${cert.highlightColor}80;"` : '';
                                    idHtml = `<div class="cert-id" ${style}>Certificate ID: ${cert.certId}`;
                                }

                                // Add warnings
                                if (!cert.validationStatus?.isValid) {
                                    idHtml += ` <span class="invalid-warning warning-icon" title="${cert.validationStatus.issues.join(', ')}">&#9888;</span>`;
                                }
                                if (certIdCount.get(cert.certId) > 1) {
                                    idHtml += ` <span class="duplicate-warning warning-icon" title="This certificate appears ${certIdCount.get(cert.certId)} times on this page">&#9888;</span>`;
                                }
                                idHtml += '</div>';
                                certHtml += idHtml;
                            }
                            
                            certHtml += '<div class="cert-details">';
                            if (settings.showSubject) {
                                certHtml += `<div>Subject: ${cert.subject}</div>`;
                            }
                            if (settings.showIssuer) {
                                certHtml += `<div>Issuer: ${cert.issuer}</div>`;
                            }
                            if (settings.showValidFrom) {
                                certHtml += `<div>Valid From: ${cert.validFrom}</div>`;
                            }
                            if (settings.showValidTo) {
                                certHtml += `<div>Valid To: ${cert.validTo}</div>`;
                            }
                            if (settings.showFingerprint && cert.fingerprint) {
                                certHtml += `<div>Fingerprint: ${cert.fingerprint}</div>`;
                            }
                            certHtml += '</div>';
                            
                            certDiv.innerHTML = certHtml;
                            certificatesDiv.appendChild(certDiv);
                        });
                    } else {
                        certificatesDiv.textContent = 'No certificates found on this page.';
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
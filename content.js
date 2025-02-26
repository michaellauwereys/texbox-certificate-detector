// Array of muted colors for highlighting
const HIGHLIGHT_COLORS = [
    '#ff5733', // Red Orange
    '#33ff57', // Green
    '#3357ff', // Blue
    '#f1c40f', // Sunflower Yellow
    '#8e44ad', // Purple
    '#e67e22', // Carrot
    '#2ecc71', // Emerald
    '#3498db', // Peter River
    '#e74c3c', // Alizarin
    '#95a5a6', // Concrete
    '#d35400', // Pumpkin
    '#1abc9c', // Turquoise
    '#9b59b6', // Amethyst
    '#34495e', // Wet Asphalt
];

// Function to format date based on settings
function formatDate(date, dateFormat, timeFormat, timezone = 'UTC') {
    // Handle UTC offset timezones
    let tzOffset = 0;
    if (timezone.startsWith('UTC')) {
        const match = timezone.match(/UTC([+-]\d+)/);
        if (match) {
            tzOffset = parseInt(match[1]) * 60; // Convert hours to minutes
            timezone = 'UTC';
        }
    }
    
    // Adjust date for UTC offset
    const adjustedDate = new Date(date.getTime() + tzOffset * 60000);

    if (dateFormat === 'iso') {
        return adjustedDate.toISOString().split('T')[0] + 
               (timeFormat !== 'none' ? ' ' + formatTime(adjustedDate, timeFormat) : '');
    }

    if (dateFormat === 'eu-short') {
        const day = adjustedDate.getUTCDate().toString().padStart(2, '0');
        const month = (adjustedDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = adjustedDate.getUTCFullYear();
        return `${day}-${month}-${year}` + 
               (timeFormat !== 'none' ? ' ' + formatTime(adjustedDate, timeFormat) : '');
    }

    if (dateFormat === 'eu-full') {
        const day = adjustedDate.getUTCDate();
        const month = adjustedDate.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
        const year = adjustedDate.getUTCFullYear();
        return `${day} ${month} ${year}` + 
               (timeFormat !== 'none' ? ' ' + formatTime(adjustedDate, timeFormat) : '');
    }

    const options = {
        year: 'numeric',
        month: dateFormat === 'short' ? 'short' : 'long',
        day: 'numeric',
        timeZone: 'UTC'
    };

    return adjustedDate.toLocaleString('en-US', options) + 
           (timeFormat !== 'none' ? ' ' + formatTime(adjustedDate, timeFormat) : '');
}

function formatTime(date, timeFormat) {
    if (timeFormat === 'none') return '';
    
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: timeFormat === '12',
        timeZone: 'UTC'
    };

    return date.toLocaleString('en-US', options);
}

// Function to remove all existing highlights
function removeExistingHighlights() {
    // Remove highlight wrappers and restore original elements
    document.querySelectorAll('.cert-highlight-wrapper').forEach(wrapper => {
        const element = wrapper.querySelector('input, textarea');
        if (element) {
            element.classList.remove('has-cert-highlight');
            wrapper.parentNode.insertBefore(element, wrapper);
        }
        wrapper.remove();
    });

    // Remove highlight spans and restore text
    document.querySelectorAll('.cert-highlight').forEach(span => {
        const parent = span.parentNode;
        if (parent) {
            parent.insertBefore(document.createTextNode(span.textContent), span);
            span.remove();
        }
    });
}

// Function to convert hex color to rgba
function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Function to highlight certificate text
function highlightCertificate(element, certText, color, opacity, startIndex) {
    if (!element || element.tagName.toLowerCase() === 'textarea') return;

    const text = element.value || element.textContent;
    startIndex = startIndex ?? text.indexOf(certText);
    if (startIndex === -1) return;

    // Create a unique identifier for this highlight
    const highlightId = `cert-${startIndex}-${certText.length}`;
    if (element.querySelector(`[data-highlight-id="${highlightId}"]`)) return;

    if (element.value !== undefined) {
        highlightInputElement(element, certText, color, opacity, startIndex, highlightId);
    } else {
        highlightTextElement(element, certText, color, opacity, startIndex, highlightId);
    }
}

function highlightInputElement(element, certText, color, opacity, startIndex, highlightId) {
    try {
        let wrapper = element.parentElement;
        if (!wrapper.classList.contains('cert-highlight-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = 'cert-highlight-wrapper';
            wrapper.style.position = 'relative';
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);
        }

        const highlight = document.createElement('div');
        highlight.className = 'cert-highlight';
        highlight.dataset.highlightId = highlightId;
        
        const computedStyle = window.getComputedStyle(element);
        Object.assign(highlight.style, {
            position: 'absolute',
            backgroundColor: hexToRgba(color, opacity),
            pointerEvents: 'none',
            font: computedStyle.font,
            padding: computedStyle.padding,
            border: computedStyle.border,
            boxSizing: computedStyle.boxSizing,
        });

        // Measure text dimensions
        const measureDiv = document.createElement('div');
        Object.assign(measureDiv.style, {
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'pre',
            font: computedStyle.font
        });
        document.body.appendChild(measureDiv);

        measureDiv.textContent = element.value.substring(0, startIndex);
        const beforeWidth = measureDiv.offsetWidth;

        measureDiv.textContent = certText;
        const certWidth = measureDiv.offsetWidth;

        document.body.removeChild(measureDiv);

        Object.assign(highlight.style, {
            left: beforeWidth + 'px',
            width: certWidth + 'px',
            height: element.offsetHeight + 'px',
            top: '0'
        });

        wrapper.appendChild(highlight);
        element.classList.add('has-cert-highlight');
    } catch (e) {
        console.error('Error highlighting input element:', e);
    }
}

function highlightTextElement(element, certText, color, opacity, startIndex, highlightId) {
    try {
        const range = document.createRange();
        const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        
        let node;
        let currentIndex = 0;
        
        while ((node = walk.nextNode()) && currentIndex + node.textContent.length <= startIndex) {
            currentIndex += node.textContent.length;
        }

        if (node) {
            const nodeStartIndex = startIndex - currentIndex;
            range.setStart(node, nodeStartIndex);
            range.setEnd(node, nodeStartIndex + certText.length);

            const span = document.createElement('span');
            span.className = 'cert-highlight';
            span.dataset.highlightId = highlightId;
            Object.assign(span.style, {
                backgroundColor: hexToRgba(color, opacity),
            });

            range.surroundContents(span);
            element.classList.add('has-cert-highlight');
        }
    } catch (e) {
        console.error('Error highlighting text element:', e);
    }
}

// Function to decode certificate
function decodeCertificate(certString, settings, colorIndex, isTextarea = false) {
    try {
        const cleanCert = certString
            .replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
        
        if (!cleanCert) {
            throw new Error('Empty certificate');
        }

        try {
            const binaryDer = atob(cleanCert);
            if (!binaryDer) {
                throw new Error('Invalid base64 encoding');
            }

            const buffer = forge.util.createBuffer(binaryDer);
            if (buffer.length() === 0) {
                throw new Error('Empty buffer');
            }

            const asn1 = forge.asn1.fromDer(buffer);
            let cert;
            
            try {
                cert = forge.pki.certificateFromAsn1(asn1);
            } catch (e) {
                if (e.message.includes('Cannot read public key')) {
                    // For non-RSA certificates, parse ASN.1 manually
                    const tbsCert = asn1.value[0];
                    const validity = tbsCert.value[4];
                    
                    // Extract and parse validity dates
                    const notBeforeValue = validity.value[0].value.toString();
                    const notAfterValue = validity.value[1].value.toString();
                    const notBefore = forge.asn1.utcTimeToDate(notBeforeValue);
                    const notAfter = forge.asn1.utcTimeToDate(notAfterValue);
                    
                    // Extract subject and issuer
                    const subject = tbsCert.value[5];
                    const issuer = tbsCert.value[3];
                    
                    // Helper function to find CN in name
                    const findCN = (name) => {
                        if (!name?.value) return null;
                        for (const set of name.value) {
                            if (!set?.value) continue;
                            for (const attr of set.value) {
                                if (attr?.value?.[0]?.value === '2.5.4.3') { // OID for CN
                                    return attr.value[1].value;
                                }
                            }
                        }
                        return null;
                    };
                    
                    const subjectCN = findCN(subject);
                    const issuerCN = findCN(issuer);
                    const now = new Date();
                    
                    const validationStatus = {
                        isValid: true,
                        issues: []
                    };

                    if (now < notBefore) {
                        validationStatus.issues.push('Certificate not yet valid');
                        validationStatus.isValid = false;
                    } else if (now > notAfter) {
                        validationStatus.issues.push('Certificate has expired');
                        validationStatus.isValid = false;
                    }
                    
                    // Calculate fingerprint
                    const md = forge.md.md5.create();
                    md.update(binaryDer);
                    const fingerprint = md.digest().toHex().match(/.{2}/g).join(':').toUpperCase();
                    
                    return {
                        success: true,
                        certId: cleanCert.slice(-5),
                        subject: subjectCN || 'No CN',
                        issuer: issuerCN || 'No CN',
                        validFrom: formatDate(notBefore, settings.dateFormat, settings.timeFormat, settings.timezone),
                        validTo: formatDate(notAfter, settings.dateFormat, settings.timeFormat, settings.timezone),
                        fingerprint: fingerprint,
                        originalText: certString,
                        highlightColor: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length],
                        isTextarea,
                        validationStatus
                    };
                } else {
                    throw e;
                }
            }
            
            if (cert) {
                const now = new Date();
                const notBefore = cert.validity.notBefore;
                const notAfter = cert.validity.notAfter;
                
                const validationStatus = {
                    isValid: true,
                    issues: []
                };

                if (now < notBefore) {
                    validationStatus.issues.push('Certificate not yet valid');
                    validationStatus.isValid = false;
                } else if (now > notAfter) {
                    validationStatus.issues.push('Certificate has expired');
                    validationStatus.isValid = false;
                }

                const subjectCN = cert.subject.getField('CN');
                const issuerCN = cert.issuer.getField('CN');
                
                // Calculate fingerprint
                const md = forge.md.md5.create();
                md.update(binaryDer);
                const fingerprint = md.digest().toHex().match(/.{2}/g).join(':').toUpperCase();
                
                return {
                    success: true,
                    certId: cleanCert.slice(-5),
                    subject: subjectCN?.value || 'No CN',
                    issuer: issuerCN?.value || 'No CN',
                    validFrom: formatDate(notBefore, settings.dateFormat, settings.timeFormat, settings.timezone),
                    validTo: formatDate(notAfter, settings.dateFormat, settings.timeFormat, settings.timezone),
                    fingerprint: fingerprint,
                    originalText: certString,
                    highlightColor: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length],
                    isTextarea,
                    validationStatus
                };
            }
        } catch (e) {
            return createInvalidCertResponse(certString, isTextarea, `Invalid certificate format: ${e.message}`);
        }
    } catch (error) {
        return createInvalidCertResponse(certString, isTextarea, error.message);
    }
}

function createInvalidCertResponse(certString, isTextarea, errorMessage) {
    return {
        success: true,
        certId: 'INVALID',
        subject: 'Invalid Certificate',
        issuer: 'Invalid Certificate',
        validFrom: 'N/A',
        validTo: 'N/A',
        originalText: certString,
        highlightColor: '#ef4444',
        isTextarea,
        validationStatus: {
            isValid: false,
            issues: [errorMessage]
        }
    };
}

// Function to check elements for certificates
function checkForCertificates(elements, settings) {
    removeExistingHighlights();
    
    const certificates = [];
    const certCount = new Map();
    const certRegex = /-----BEGIN CERTIFICATE-----[^-]*-----END CERTIFICATE-----/g;
    
    elements.forEach(element => {
        const text = element.value || element.textContent;
        const isTextarea = element.tagName.toLowerCase() === 'textarea';
        let match;
        
        while ((match = certRegex.exec(text)) !== null) {
            const cert = match[0];
            certCount.set(cert, (certCount.get(cert) || 0) + 1);
            
            const decodedCert = decodeCertificate(cert, settings, certificates.length, isTextarea);
            if (decodedCert.success) {
                if (settings.enableHighlighting && !isTextarea) {
                    highlightCertificate(element, cert, decodedCert.highlightColor, settings.highlightOpacity, match.index);
                }
                decodedCert.duplicateCount = certCount.get(cert);
                certificates.push(decodedCert);
            }
        }
    });
    return certificates;
}

// Listen for port connections
browser.runtime.onConnect.addListener(port => {
    if (port.name === "popup") {
        port.onMessage.addListener(request => {
            if (request.action === "getCertificates") {
                browser.storage.sync.get({
                    elementRules: ['textarea'],
                    dateFormat: 'short',
                    timeFormat: '24',
                    enableHighlighting: true,
                    highlightOpacity: 0.3,
                    timezone: 'UTC'
                }).then(settings => {
                    const elements = Array.from(new Set(
                        settings.elementRules.flatMap(rule => {
                            try {
                                return Array.from(document.querySelectorAll(rule));
                            } catch (e) {
                                console.error(`Invalid selector: ${rule}`, e);
                                return [];
                            }
                        })
                    ));
                    
                    port.postMessage({
                        action: "certificatesFound",
                        certificates: checkForCertificates(elements, settings)
                    });
                });
            }
        });

        port.onDisconnect.addListener(() => {
            removeExistingHighlights();
        });
    }
}); 

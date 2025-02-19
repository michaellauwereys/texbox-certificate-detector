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
    if (dateFormat === 'iso') {
        return date.toLocaleString('en-US', { timeZone: timezone }).split(',')[0] + 
               (timeFormat !== 'none' ? ' ' + formatTime(date, timeFormat, timezone) : '');
    }

    const options = {
        year: 'numeric',
        month: dateFormat === 'short' ? 'short' : 'long',
        day: 'numeric',
        timeZone: timezone,
        ...(timeFormat !== 'none' && {
            hour: '2-digit',
            minute: '2-digit',
            hour12: timeFormat === '12'
        })
    };

    return date.toLocaleString('en-US', options);
}

function formatTime(date, timeFormat, timezone = 'UTC') {
    if (timeFormat === 'none') return '';
    
    return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: timeFormat === '12',
        timeZone: timezone
    });
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
            color: '#000000'
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
                color: '#000000'
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
        
        if (!cleanCert) throw new Error('Empty certificate');

        try {
            const binaryDer = atob(cleanCert);
            if (!binaryDer) throw new Error('Invalid base64 encoding');

            const buffer = forge.util.createBuffer(binaryDer);
            const cert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(buffer));
            
            const now = new Date();
            const notBefore = cert.validity.notBefore;
            const notAfter = cert.validity.notAfter;
            
            const validationStatus = {
                isValid: now >= notBefore && now <= notAfter,
                issues: []
            };

            if (now < notBefore) validationStatus.issues.push('Certificate not yet valid');
            if (now > notAfter) validationStatus.issues.push('Certificate has expired');

            const subjectCN = cert.subject.getField('CN');
            const issuerCN = cert.issuer.getField('CN');
            
            return {
                success: true,
                certId: cleanCert.slice(-5),
                subject: subjectCN?.value || 'No CN',
                issuer: issuerCN?.value || 'No CN',
                validFrom: formatDate(notBefore, settings.dateFormat, settings.timeFormat, settings.timezone),
                validTo: formatDate(notAfter, settings.dateFormat, settings.timeFormat, settings.timezone),
                originalText: certString,
                highlightColor: HIGHLIGHT_COLORS[colorIndex % HIGHLIGHT_COLORS.length],
                isTextarea,
                validationStatus
            };
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
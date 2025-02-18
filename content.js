// Function to decode certificate
function decodeCertificate(certString) {
    try {
        // Remove headers, footers, and whitespace
        const cleanCert = certString
            .replace('-----BEGIN CERTIFICATE-----', '')
            .replace('-----END CERTIFICATE-----', '')
            .replace(/\s/g, '');
        
        // Get last 5 characters of the raw cert for identification
        const certId = cleanCert.slice(-5);
        
        // Decode base64
        const binaryDer = atob(cleanCert);
        
        // Convert to forge buffer
        const buffer = forge.util.createBuffer(binaryDer);
        const asn1 = forge.asn1.fromDer(buffer);
        const cert = forge.pki.certificateFromAsn1(asn1);
        
        // Extract subject CN
        const subjectCN = cert.subject.getField('CN');
        const issuerCN = cert.issuer.getField('CN');
        
        return {
            success: true,
            certId: certId,
            subject: subjectCN ? subjectCN.value : 'No CN',
            issuer: issuerCN ? issuerCN.value : 'No CN',
            validFrom: cert.validity.notBefore,
            validTo: cert.validity.notAfter
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to extract individual certificates from text
function extractCertificates(text) {
    const certRegex = /-----BEGIN CERTIFICATE-----[^-]*-----END CERTIFICATE-----/g;
    return text.match(certRegex) || [];
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCertificates") {
        const textboxes = document.querySelectorAll('textarea, input[type="text"]');
        let allCertificates = [];
        
        textboxes.forEach(textbox => {
            const certificates = extractCertificates(textbox.value);
            certificates.forEach(cert => {
                const decodedCert = decodeCertificate(cert);
                if (decodedCert.success) {
                    allCertificates.push(decodedCert);
                }
            });
        });
        
        sendResponse({ certificates: allCertificates });
    }
}); 
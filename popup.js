document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getCertificates"}, function(response) {
            const certificatesDiv = document.getElementById('certificates');
            
            if (response && response.certificates && response.certificates.length > 0) {
                response.certificates.forEach(cert => {
                    const certDiv = document.createElement('div');
                    certDiv.className = 'cert-container';
                    certDiv.innerHTML = `
                        <div class="cert-id">Certificate ID: ${cert.certId}</div>
                        <div class="cert-details">
                            <div>Subject: ${cert.subject}</div>
                            <div>Issuer: ${cert.issuer}</div>
                            <div>Valid From: ${cert.validFrom}</div>
                            <div>Valid To: ${cert.validTo}</div>
                        </div>
                    `;
                    certificatesDiv.appendChild(certDiv);
                });
            } else {
                certificatesDiv.textContent = 'No certificates found on this page.';
            }
        });
    });
}); 
import { NextRequest, NextResponse } from 'next/server';
import { leadsService } from '@/lib/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: formId } = await params;
    const form = await leadsService.getFormById(formId);

    if (!form) {
        return new NextResponse(
            `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form Not Found</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .error { background: white; padding: 2rem; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
        h1 { color: #ef4444; margin: 0 0 1rem 0; }
    </style>
</head>
<body>
    <div class="error">
        <h1>Form Not Found</h1>
        <p>This form does not exist or has been deleted.</p>
    </div>
</body>
</html>`,
            { headers: { 'Content-Type': 'text/html' } }
        );
    }

    // Increment visit count
    await leadsService.incrementFormVisits(formId);

    const customFields = form.custom_fields || [];

    // Generate HTML form
    const fieldsHTML = customFields.map(field => {
        const required = field.required ? 'required' : '';
        const requiredMark = field.required ? '<span style="color: #ef4444;">*</span>' : '';

        if (field.type === 'textarea') {
            return `
                <div class="form-group">
                    <label>${field.label} ${requiredMark}</label>
                    <textarea name="${field.id}" ${required} rows="4"></textarea>
                </div>
            `;
        } else if (field.type === 'select') {
            const options = field.options?.map(opt => `<option value="${opt}">${opt}</option>`).join('') || '';
            return `
                <div class="form-group">
                    <label>${field.label} ${requiredMark}</label>
                    <select name="${field.id}" ${required}>
                        <option value="">Select...</option>
                        ${options}
                    </select>
                </div>
            `;
        } else {
            return `
                <div class="form-group">
                    <label>${field.label} ${requiredMark}</label>
                    <input type="${field.type}" name="${field.id}" ${required} />
                </div>
            `;
        }
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${form.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .container { 
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; font-size: 0.95rem; }
        .form-content { padding: 2rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { 
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
            font-size: 0.95rem;
        }
        input, textarea, select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            font-family: inherit;
            transition: border-color 0.2s;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        textarea { resize: vertical; }
        .submit-btn {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        .submit-btn:active { transform: translateY(0); }
        .footer {
            text-align: center;
            padding: 1.5rem;
            color: #6b7280;
            font-size: 0.875rem;
            border-top: 1px solid #e5e7eb;
        }
        .success-message {
            display: none;
            text-align: center;
            padding: 3rem 2rem;
        }
        .success-message.show { display: block; }
        .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3rem;
        }
        .error-message {
            background: #fee2e2;
            color: #991b1b;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            display: none;
        }
        .error-message.show { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${form.name}</h1>
            <p>Please fill in the details below</p>
        </div>
        
        <div class="form-content">
            <div class="error-message" id="errorMessage"></div>
            
            <form id="leadForm" style="display: block;">
                ${fieldsHTML}
                <button type="submit" class="submit-btn">Submit</button>
            </form>
            
            <div class="success-message" id="successMessage">
                <div class="success-icon">✓</div>
                <h2 style="color: #10b981; margin-bottom: 0.5rem;">Thank You!</h2>
                <p style="color: #6b7280;">Your details have been submitted successfully.</p>
            </div>
        </div>

        <div class="footer">
            Powered by LeadHive
        </div>
    </div>

    <script>
        document.getElementById('leadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/forms/${formId}/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    document.getElementById('leadForm').style.display = 'none';
                    document.getElementById('successMessage').classList.add('show');
                    document.getElementById('errorMessage').classList.remove('show');
                } else {
                    const error = await response.json();
                    document.getElementById('errorMessage').textContent = error.message || 'Something went wrong. Please try again.';
                    document.getElementById('errorMessage').classList.add('show');
                }
            } catch (error) {
                document.getElementById('errorMessage').textContent = 'Network error. Please check your connection and try again.';
                document.getElementById('errorMessage').classList.add('show');
            }
        });
    </script>
</body>
</html>`;

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}

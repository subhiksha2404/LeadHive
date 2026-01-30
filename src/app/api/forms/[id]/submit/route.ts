import { NextRequest, NextResponse } from 'next/server';
import { leadsService } from '@/lib/storage';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: formId } = await params;
        const form = await leadsService.getFormById(formId);

        if (!form) {
            return NextResponse.json(
                { message: 'Form not found' },
                { status: 404 }
            );
        }

        const formData = await request.json();

        // Extract contact details from form data
        const customFields = form.custom_fields || [];
        const nameField = customFields.find(f => f.label.toLowerCase().includes('name')) || customFields[0];
        const emailField = customFields.find(f => f.type === 'email') || customFields.find(f => f.label.toLowerCase().includes('email'));
        const phoneField = customFields.find(f => f.type === 'tel') || customFields.find(f => f.label.toLowerCase().includes('phone'));
        const companyField = customFields.find(f => f.label.toLowerCase().includes('company'));

        // Create contact
        await leadsService.addContact({
            name: nameField ? (formData[nameField.id] || 'Unknown') : 'Unknown',
            email: emailField ? formData[emailField.id] : '',
            phone: phoneField ? formData[phoneField.id] : '',
            company: companyField ? formData[companyField.id] : '',
            form_id: form.id,
            form_name: form.name,
            form_data: formData
        }, (form as any).user_id);

        // Increment submission count
        await leadsService.incrementFormSubmissions(form.id);

        return NextResponse.json(
            { message: 'Form submitted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Form submission error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

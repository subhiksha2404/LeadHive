import { NextRequest, NextResponse } from 'next/server';
import { leadsService } from '@/lib/storage';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: formId } = await params;
        const form = leadsService.getFormById(formId);

        if (!form) {
            return NextResponse.json(
                { message: 'Form not found' },
                { status: 404 }
            );
        }

        const formData = await request.json();

        // Extract contact details from form data
        const nameField = form.custom_fields.find(f => f.label.toLowerCase().includes('name')) || form.custom_fields[0];
        const emailField = form.custom_fields.find(f => f.type === 'email') || form.custom_fields.find(f => f.label.toLowerCase().includes('email'));
        const phoneField = form.custom_fields.find(f => f.type === 'tel') || form.custom_fields.find(f => f.label.toLowerCase().includes('phone'));
        const companyField = form.custom_fields.find(f => f.label.toLowerCase().includes('company'));

        // Create contact
        leadsService.addContact({
            name: formData[nameField.id] || 'Unknown',
            email: emailField ? formData[emailField.id] : '',
            phone: phoneField ? formData[phoneField.id] : '',
            company: companyField ? formData[companyField.id] : '',
            form_id: form.id,
            form_name: form.name,
            form_data: formData
        });

        // Increment submission count
        leadsService.incrementFormSubmissions(form.id);

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

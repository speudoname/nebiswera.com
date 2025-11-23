export function getVerificationEmailKA(verificationUrl: string) {
  return {
    subject: 'დაადასტურეთ ელ-ფოსტა - ნებისწერა',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">კეთილი იყოს თქვენი მობრძანება ნებისწერაში!</h1>
        <p>გმადლობთ რეგისტრაციისთვის. გთხოვთ დაადასტუროთ ელ-ფოსტა ქვემოთ მოცემულ ღილაკზე დაჭერით:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #6366f1; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            ელ-ფოსტის დადასტურება
          </a>
        </div>
        <p style="color: #666;">ან დააკოპირეთ ეს ბმული თქვენს ბრაუზერში:</p>
        <p style="color: #6366f1; word-break: break-all;">${verificationUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          დადასტურებისთვის გაქვთ 24 საათი. ამის შემდეგ დაგჭირდებათ ახალი ბმულის მოთხოვნა.
        </p>
      </div>
    `,
    text: `
კეთილი იყოს თქვენი მობრძანება ნებისწერაში!

გთხოვთ დაადასტუროთ ელ-ფოსტა ამ ბმულზე გადასვლით:
${verificationUrl}

დადასტურებისთვის გაქვთ 24 საათი.
    `.trim(),
  }
}

export function getPasswordResetEmailKA(resetUrl: string) {
  return {
    subject: 'პაროლის აღდგენა - ნებისწერა',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">პაროლის აღდგენის მოთხოვნა</h1>
        <p>თქვენ მოითხოვეთ პაროლის აღდგენა. დააჭირეთ ქვემოთ მოცემულ ღილაკს ახალი პაროლის დასაყენებლად:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #6366f1; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            პაროლის აღდგენა
          </a>
        </div>
        <p style="color: #666;">ან დააკოპირეთ ეს ბმული თქვენს ბრაუზერში:</p>
        <p style="color: #6366f1; word-break: break-all;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          ბმული მოქმედებს 1 საათის განმავლობაში. თუ ეს მოთხოვნა თქვენ არ გაგიგზავნიათ, უგულებელყოთ ეს წერილი.
        </p>
      </div>
    `,
    text: `
პაროლის აღდგენის მოთხოვნა

თქვენ მოითხოვეთ პაროლის აღდგენა. ახალი პაროლის დასაყენებლად ეწვიეთ ამ ბმულს:
${resetUrl}

ბმული მოქმედებს 1 საათის განმავლობაში. თუ ეს მოთხოვნა თქვენ არ გაგიგზავნიათ, უგულებელყოთ ეს წერილი.
    `.trim(),
  }
}

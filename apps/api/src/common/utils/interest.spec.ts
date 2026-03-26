describe('flat interest', () => {
  it('computes interest and total for flat rate', () => {
    const principal = 1000;
    const ratePct = 10;
    const interestAmount = principal * (ratePct / 100);
    const totalAmount = principal + interestAmount;
    const termMonths = 3;
    const monthlyInstallment = totalAmount / termMonths;
    expect(interestAmount).toBe(100);
    expect(totalAmount).toBe(1100);
    expect(monthlyInstallment).toBeCloseTo(1100 / 3, 5);
  });
});

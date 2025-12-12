"use client";
import React from "react";

// type FormData = {
//   email: string;
//   password: string;
// };

function LoginView() {
  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors, isSubmitting },
  // } = useForm<FormData>();

  // const [login] = useLoginMutation();
  // const [error, setError] = useState<string | null>(null);

  // const handleCheck = useCallback(
  //   async (data: FormData) => {
  //     setError(null);
  //     try {
  //       await login(data).unwrap();
  //       // TODO: redirect
  //     } catch (err: unknown) {
  //       const errorMessage =
  //         err && typeof err === "object" && "data" in err
  //           ? (err as { data?: { message?: string } }).data?.message
  //           : undefined;
  //       setError(errorMessage || "Đăng nhập thất bại");
  //     }
  //   },
  //   [login]
  // );

  return (
    <></>
    // <AdContainer>
    //   {/* Card login */}
    //   <AdCard>
    //     <AdLogo size="small">ISB</AdLogo>
    //     <AdTitle>Đăng nhập hệ thống</AdTitle>
    //     <AdSubtitle>Hệ thống đăng ký học phần - ISB</AdSubtitle>

    //     <AdForm onSubmit={handleSubmit(handleCheck)}>
    //       {/* Email */}
    //       <AdFormGroup>
    //         <AdLabel>Email / Mã sinh viên</AdLabel>

    //         <AdInput
    //           type="text"
    //           placeholder="21520099@student.hcmus.edu.vn"
    //           error={!!errors.email}
    //           {...register("email", { required: "Vui lòng nhập email" })}
    //         />

    //         {errors.email && <AdErrorText>{errors.email.message}</AdErrorText>}
    //       </AdFormGroup>

    //       {/* Password */}
    //       <AdFormGroup>
    //         <AdLabel>Mật khẩu</AdLabel>
    //         <AdLink align="right">Quên mật khẩu?</AdLink>

    //         <AdInput
    //           type="password"
    //           placeholder="••••••••"
    //           error={!!errors.password}
    //           {...register("password", {
    //             required: "Vui lòng nhập mật khẩu",
    //             minLength: { value: 6, message: "Tối thiểu 6 ký tự" },
    //           })}
    //         />

    //         {errors.password && <AdErrorText>{errors.password.message}</AdErrorText>}
    //       </AdFormGroup>

    //       {/* Submit button */}
    //       <AdButton type="submit" disabled={isSubmitting}>
    //         {isSubmitting && <AdSpinner size="small" />}
    //         {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
    //       </AdButton>
    //     </AdForm>

    //     {error && <AdErrorBox>Login Failed: {error}</AdErrorBox>}

    //     <AdFooter>© 2025 ISB System – Nhóm sinh viên HCMUS</AdFooter>
    //   </AdCard>
    // </AdContainer>
  );
}

export default React.memo(LoginView);

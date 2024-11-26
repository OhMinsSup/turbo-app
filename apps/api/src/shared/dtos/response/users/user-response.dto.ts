import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

export class RoleResponseDto {
  @ApiProperty({
    title: "기호",
    description: "역할 기호",
    example: "USER",
    required: true,
  })
  @Expose()
  readonly symbol: string;
}

export class UserProfileResponseDto {
  @ApiProperty({
    title: "이미지",
    description: "프로필 이미지",
  })
  @Expose()
  readonly image: string;
}

export class UserResponseDto {
  @ApiProperty({
    title: "ID",
    description: "사용자 ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: true,
  })
  @Expose()
  readonly id: string;

  @ApiProperty({
    title: "이메일",
    description: "사용자 이메일",
    example: "test@naver.com",
    required: true,
  })
  @Expose()
  readonly email: string;

  @ApiProperty({
    title: "이름",
    description: "사용자 이름",
    example: "홍길동",
    required: true,
  })
  @Expose()
  readonly username: string;

  @ApiProperty({
    title: "이메일 확인 일시",
    description: "이메일 확인 일시",
    type: Date,
    required: false,
    format: "date-time",
  })
  @Expose()
  readonly emailConfirmedAt: Date | null;

  @ApiProperty({
    title: "정지 여부",
    description: "정지 여부",
    example: false,
    required: true,
  })
  @Expose()
  readonly isSuspended: boolean;

  @ApiProperty({
    title: "삭제일",
    description: "삭제일",
    type: Date,
    required: true,
    format: "date-time",
  })
  @Expose()
  readonly deletedAt: Date;

  @ApiProperty({ description: "역할", type: RoleResponseDto })
  @Type(() => RoleResponseDto)
  @Expose()
  readonly Role: RoleResponseDto;

  @ApiProperty({ description: "프로필", type: UserProfileResponseDto })
  @Type(() => UserProfileResponseDto)
  @Expose()
  readonly UserProfile: UserProfileResponseDto;
}

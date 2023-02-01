import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Classes, ClassesDocument } from '@/modules/classes/classes.schema';
import { Model } from 'mongoose';
import { PaginationRequestFullDto } from '@/dtos/pagination-request.dto';
import { PaginationDto } from '@/dtos/pagination-response.dto';
import { SortType } from '@/enums/sort.enum';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Classes.name) private classesModel: Model<ClassesDocument>,
  ) {}
  async createNewClass(name: string, school: string): Promise<Classes> {
    const isExistedClass = await this.classesModel.findOne({ name, school });
    if (isExistedClass) return isExistedClass;
    return await this.classesModel.create({ name, school });
  }

  async addMember(name: string, school: string, members: any[]) {
    const isExistedClass = await this.classesModel.findOne({ name, school });
    if (isExistedClass) {
      isExistedClass.members = members;
      await isExistedClass.save();

      return isExistedClass;
    }
    return await this.classesModel.create({ name, school, members });
  }

  async findClassById(id: string) {
    const classObj = await this.classesModel.findById(id).populate({
      path: 'members',
    });

    return classObj;
  }

  async findAll(
    paginationRequestFullDto: PaginationRequestFullDto,
  ): Promise<PaginationDto<Classes>> {
    const filter = {
      ...(paginationRequestFullDto.keyword && {
        name: {
          $regex: `.*${paginationRequestFullDto.keyword}.*`,
          $options: 'i',
        },
      }),
    };

    const sortObj = {};
    sortObj[paginationRequestFullDto.sortBy] =
      paginationRequestFullDto.sortType === SortType.asc ? 1 : -1;

    const total = await this.classesModel.countDocuments(filter);

    const classes = await this.classesModel
      .find(filter)
      .select('-deleted -createdAt -updatedAt')
      .sort(sortObj)
      .skip(paginationRequestFullDto.offset)
      .limit(paginationRequestFullDto.limit);

    return {
      total,
      results: classes,
    };
  }
}
